const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateSocket } = require('../middleware/auth');
const { hybridEncrypt, signMessage } = require('../utils/encryption');

// Store active connections
const activeUsers = new Map(); // userId -> Set of socketIds

/**
 * Initialize Socket.IO connection handling
 */
function initializeSocket(io) {
  // Authentication middleware for Socket.IO
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.userId.toString();
    
    console.log(`✅ User ${userId} connected (socket: ${socket.id})`);

    // Add user to active users
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);

    // Update user online status
    User.findByIdAndUpdate(userId, { 
      isOnline: true,
      lastSeen: new Date()
    }).exec();

    // Notify others that user is online
    socket.broadcast.emit('user:online', { userId });

    // Join user's personal room
    socket.join(`user:${userId}`);

    /**
     * Handle sending a message
     */
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content, messageType = 'text' } = data;

        if (!receiverId || !content) {
          return socket.emit('error', { message: 'Missing required fields' });
        }

        // Get receiver's public key
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          return socket.emit('error', { message: 'Receiver not found' });
        }

        // Encrypt message
        const { encryptedMessage, encryptedKey, iv, authTag } = hybridEncrypt(
          content,
          receiver.publicKey
        );

        // Generate signature
        const signature = signMessage(content, socket.user.privateKey || '');

        // Create chat ID (sorted to ensure consistency)
        const chatId = [userId, receiverId].sort().join('_');

        // Save message to database
        const message = new Message({
          senderId: userId,
          receiverId,
          chatId,
          content, // Store plaintext for now (in production, consider not storing)
          encryptedContent: encryptedMessage,
          messageType,
          encryptionKey: encryptedKey,
          iv,
          signature,
          isDelivered: false
        });

        await message.save();

        // Populate sender info
        await message.populate('senderId', 'username displayName avatar');
        await message.populate('receiverId', 'username displayName avatar');

        // Mark as delivered
        message.isDelivered = true;
        message.deliveredAt = new Date();
        await message.save();

        // Send to receiver if online
        const receiverSockets = activeUsers.get(receiverId);
        if (receiverSockets && receiverSockets.size > 0) {
          io.to(`user:${receiverId}`).emit('message:new', {
            message: {
              _id: message._id,
              senderId: message.senderId,
              receiverId: message.receiverId,
              chatId: message.chatId,
              encryptedContent: message.encryptedContent,
              messageType: message.messageType,
              encryptionKey: message.encryptionKey,
              iv: message.iv,
              signature: message.signature,
              createdAt: message.createdAt
            }
          });
        }

        // Confirm to sender
        socket.emit('message:sent', {
          messageId: message._id,
          chatId: message.chatId
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Handle typing indicator
     */
    socket.on('typing:start', (data) => {
      const { receiverId } = data;
      if (receiverId) {
        socket.to(`user:${receiverId}`).emit('typing:start', {
          userId,
          username: socket.user.username
        });
      }
    });

    socket.on('typing:stop', (data) => {
      const { receiverId } = data;
      if (receiverId) {
        socket.to(`user:${receiverId}`).emit('typing:stop', { userId });
      }
    });

    /**
     * Handle message read receipt
     */
    socket.on('message:read', async (data) => {
      try {
        const { messageIds } = data;
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            receiverId: userId
          },
          {
            $set: {
              isRead: true,
              readAt: new Date()
            }
          }
        );

        // Notify sender
        const messages = await Message.find({ _id: { $in: messageIds } });
        const senderIds = [...new Set(messages.map(m => m.senderId.toString()))];
        
        senderIds.forEach(senderId => {
          io.to(`user:${senderId}`).emit('message:read', {
            messageIds,
            readBy: userId
          });
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`❌ User ${userId} disconnected (socket: ${socket.id})`);

      // Remove socket from active users
      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUsers.delete(userId);
          
          // Update user offline status
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date()
          });

          // Notify others that user is offline
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });
  });
}

module.exports = { initializeSocket, activeUsers };

