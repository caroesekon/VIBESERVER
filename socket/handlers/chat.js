const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');

module.exports = (socket, io) => {
  // Send a message
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, content, attachments = [] } = data;
      const senderId = socket.userId;

      if (!receiverId || !content) {
        socket.emit('message_error', { error: 'Receiver and content required' });
        return;
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] }
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
        });
      }

      // Create message
      const message = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        receiver: receiverId,
        content,
        attachments,
        read: false,
      });

      await message.populate('sender', 'name avatar');

      // Update conversation's last message
      conversation.lastMessage = message._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      // Emit to receiver's room
      io.to(`user_${receiverId}`).emit('new_message', message);
      // Also emit back to sender for confirmation
      socket.emit('message_sent', message);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('mark_read', async (messageId) => {
    try {
      const message = await Message.findById(messageId);
      if (message && message.receiver.toString() === socket.userId && !message.read) {
        message.read = true;
        await message.save();
        // Notify sender that message was read
        io.to(`user_${message.sender}`).emit('message_read', { messageId, readAt: new Date() });
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  // Typing indicator
  socket.on('typing', ({ receiverId, isTyping }) => {
    socket.to(`user_${receiverId}`).emit('user_typing', { userId: socket.userId, isTyping });
  });
};