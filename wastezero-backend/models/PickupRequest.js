const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wasteType: { type: String, required: true },
  wasteDescription: { type: String },
  estimatedQuantity: { type: String, required: true },
  pickupAddress: { type: String, required: true },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true },
  contactDetails: { type: String },
  status: { type: String, enum: ['open', 'accepted', 'completed'], default: 'open' },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);
