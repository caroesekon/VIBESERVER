module.exports = (socket, io) => {
  // Notifications are typically pushed from backend, not received via socket from client.
  // But we can handle ack if needed.
  socket.on('notification_read', (notificationId) => {
    // Could be used to mark notification as read in real-time
    socket.emit('notification_ack', { notificationId });
  });
};