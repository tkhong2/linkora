const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const onlineUsers = new Map(); // userId -> socketId

function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    if (!process.env.JWT_SECRET) return next(new Error('Server config error'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    socket.join(userId);

    io.emit('user_status', { userId, online: true });
    socket.emit('online_users', Array.from(onlineUsers.keys()));

    // Send private message
    socket.on('send_message', async ({ receiverId, content, image }) => {
      try {
        if (!content?.trim() && !image) return;
        const msg = await Message.create({ sender: userId, receiver: receiverId, content: content || '', image: image || '' });
        await msg.populate('sender', 'username avatar');

        socket.emit('message_sent', msg);
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket) io.to(receiverSocket).emit('receive_message', msg);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Typing
    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) io.to(receiverSocket).emit('user_typing', { userId, isTyping });
    });

    // Mark seen
    socket.on('mark_seen', ({ senderId }) => {
      const senderSocket = onlineUsers.get(senderId);
      if (senderSocket) io.to(senderSocket).emit('messages_seen', { by: userId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_status', { userId, online: false });
    });
  });
}

module.exports = { initSocket, onlineUsers };
