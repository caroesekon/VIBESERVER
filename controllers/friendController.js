const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Send friend request
// @route   POST /api/friends/request/:userId
const sendRequest = async (req, res) => {
  try {
    const receiverId = req.params.userId;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(senderId);
    if (currentUser.friends.includes(receiverId)) {
      return res.status(400).json({ success: false, message: 'Already friends with this user' });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Friend request already sent' });
      }
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Already friends' });
      }
      if (existing.status === 'rejected') {
        existing.status = 'pending';
        await existing.save();
        
        await Notification.create({
          user: receiverId,
          type: 'friend_request',
          sender: senderId,
          message: `${req.user.name} sent you a friend request`
        });
        
        return res.json({ success: true, data: existing, message: 'Friend request resent' });
      }
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    await Notification.create({
      user: receiverId,
      type: 'friend_request',
      sender: senderId,
      message: `${req.user.name} sent you a friend request`
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new_notification', {
        type: 'friend_request',
        sender: {
          _id: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar
        },
        message: `${req.user.name} sent you a friend request`
      });
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('Send request error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Friend request already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/request/:requestId/accept
const acceptRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'accepted';
    await request.save();

    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
    await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

    const senderUser = await User.findById(request.sender).select('name avatar');

    await Notification.create({
      user: request.sender,
      type: 'friend_accept',
      sender: req.user._id,
      message: `${req.user.name} accepted your friend request`
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.sender}`).emit('new_notification', {
        type: 'friend_accept',
        sender: {
          _id: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar
        },
        message: `${req.user.name} accepted your friend request`
      });
      
      io.to(`user_${request.sender}`).emit('friend_updated', {
        userId: request.receiver,
        action: 'added'
      });
      io.to(`user_${request.receiver}`).emit('friend_updated', {
        userId: request.sender,
        action: 'added'
      });
    }

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject friend request
// @route   PUT /api/friends/request/:requestId/reject
const rejectRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get pending friend requests for current user
// @route   GET /api/friends/requests
const getRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender', 'name email avatar bio');

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get friends list
// @route   GET /api/friends/list
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name email avatar bio')
      .lean();
    
    res.json({ success: true, data: user?.friends || [] });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:friendId
const removeFriend = async (req, res) => {
  try {
    const friendId = req.params.friendId;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('friend_updated', {
        userId: friendId,
        action: 'removed'
      });
      io.to(`user_${friendId}`).emit('friend_updated', {
        userId: userId,
        action: 'removed'
      });
    }

    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get friend status with a user
// @route   GET /api/friends/status/:userId
const getFriendStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === userId) {
      return res.json({
        success: true,
        data: { 
          isFriend: false, 
          requestStatus: null, 
          isSelf: true,
          isFriendRequestSent: false,
          isFriendRequestReceived: false
        }
      });
    }

    const currentUser = await User.findById(currentUserId);
    const isFriend = currentUser?.friends?.includes(userId) || false;

    const request = await FriendRequest.findOne({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ],
      status: 'pending'
    });

    let requestStatus = null;
    let isReceiver = false;
    let isSender = false;
    let requestId = null;

    if (request) {
      requestStatus = 'pending';
      requestId = request._id;
      isReceiver = request.receiver.toString() === currentUserId.toString();
      isSender = request.sender.toString() === currentUserId.toString();
    }

    res.json({
      success: true,
      data: {
        isFriend,
        requestStatus,
        requestId,
        isReceiver,
        isSender,
        isFriendRequestSent: isSender && requestStatus === 'pending',
        isFriendRequestReceived: isReceiver && requestStatus === 'pending'
      }
    });
  } catch (error) {
    console.error('Get friend status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Cancel sent friend request
// @route   DELETE /api/friends/request/:userId/cancel
const cancelRequest = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user._id;

    const request = await FriendRequest.findOneAndDelete({
      sender: currentUserId,
      receiver: userId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'No pending request found' });
    }

    res.json({ success: true, message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getRequests,
  getFriends,
  removeFriend,
  getFriendStatus,
  cancelRequest
};