const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/messages/contactable-users - Users this person is allowed to start a new conversation with
// Citizens <-> Volunteers/Admins, Volunteers <-> Citizens/Admins, Admin <-> everyone.
exports.getContactableUsers = async (req, res) => {
  try {
    let roleFilter;
    if (req.user.role === 'admin') {
      roleFilter = { role: { $in: ['user', 'volunteer'] } };
    } else if (req.user.role === 'volunteer') {
      roleFilter = { role: { $in: ['user', 'admin'] } };
    } else {
      roleFilter = { role: { $in: ['volunteer', 'admin'] } };
    }

    const users = await User.find({
      ...roleFilter,
      _id: { $ne: req.user.id },
      isSuspended: false
    }).select('name email role location');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      content
    });

    await Notification.create({
      userId: receiverId,
      message: 'You have a new message',
      type: 'message'
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/:userId - Get conversation
exports.getConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/contacts - Get all contacts the user has chatted with
exports.getContacts = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }]
    }).populate('senderId receiverId', 'name email role');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
