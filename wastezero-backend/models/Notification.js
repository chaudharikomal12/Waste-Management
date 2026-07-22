const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['application', 'message', 'opportunity', 'system'], default: 'system' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
