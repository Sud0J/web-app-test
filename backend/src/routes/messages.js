const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { hybridEncrypt, signMessage } = require('../utils/encryption');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get chat history
 * GET /api/messages/chat/:chatId?limit=50&before=timestamp
 */
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before ? new Date(req.query.before) : new Date();

    // Verify user is part of this chat
    const [userId1, userId2] = chatId.split('_');
    if (userId1 !== req.userId.toString() && userId2 !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({
      chatId,
      createdAt: { $lt: before },
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'username displayName avatar')
    .populate('receiverId', 'username displayName avatar');

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark messages as read
 * PUT /api/messages/read
 */
router.put('/read', async (req, res) => {
  try {
    const { messageIds } = req.body;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiverId: req.userId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete message
 * DELETE /api/messages/:messageId
 */
router.delete('/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete
    if (message.senderId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

