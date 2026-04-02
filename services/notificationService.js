const Notification = require('../models/Notification');
const User = require('../models/User');

// Create a notification for a user
const createNotification = async (userId, type, senderId, postId = null, message) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      sender: senderId,
      post: postId,
      message,
    });
    // Optionally emit via socket
    const io = require('../socket').getIO();
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
    }
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// Get unread count for a user
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, read: false });
};

// Mark all as read
const markAllAsRead = async (userId) => {
  return Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
};

module.exports = {
  createNotification,
  getUnreadCount,
  markAllAsRead,
};