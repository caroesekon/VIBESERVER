const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Helper to get or create conversation between two users
const getOrCreateConversation = async (user1, user2) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [user1, user2] }
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [user1, user2],
      lastMessage: null,
      updatedAt: new Date()
    });
  }
  return conversation;
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name avatar')
      .sort('-updatedAt')
      .lean();

    // Get last message for each conversation
    for (let conv of conversations) {
      const lastMsg = await Message.findOne({ conversation: conv._id })
        .sort('-createdAt')
        .limit(1);
      conv.lastMessage = lastMsg;
      
      // Add unread count
      conv.unreadCount = await Message.countDocuments({
        conversation: conv._id,
        receiver: req.user._id,
        read: false
      });
      
      // Add current user ID for frontend
      conv.currentUserId = req.user._id;
    }

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create or get conversation with a user
// @route   POST /api/messages/conversations/:userId
const createConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
        lastMessage: null
      });
    }

    await conversation.populate('participants', 'name avatar');
    
    // Add current user ID for frontend
    const convObj = conversation.toObject();
    convObj.currentUserId = currentUserId;
    convObj.unreadCount = 0;

    res.json({ success: true, data: convObj });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get messages with a specific user
// @route   GET /api/messages/:userId
const getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, otherUserId] }
    });

    if (!conversation) {
      return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .lean();

    const total = await Message.countDocuments({ conversation: conversation._id });

    // Mark messages as read if current user is receiver
    await Message.updateMany(
      { conversation: conversation._id, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      data: messages.reverse(), // return in chronological order
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Send a message
// @route   POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, attachments = [] } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver and content required' });
    }

    const conversation = await getOrCreateConversation(senderId, receiverId);

    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
      attachments,
      read: false
    });

    await message.populate('sender', 'name avatar');

    // Update conversation's last message and timestamp
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new_message', message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
const markRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.read = true;
    await message.save();

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markRead
};