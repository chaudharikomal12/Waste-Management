const PickupRequest = require('../models/PickupRequest');
const Notification = require('../models/Notification');

// POST /api/pickups - User creates pickup
exports.createPickup = async (req, res) => {
  try {
    const { wasteType, wasteDescription, estimatedQuantity, pickupAddress,
      preferredDate, preferredTime, contactDetails } = req.body;

    const pickup = await PickupRequest.create({
      userId: req.user.id,
      wasteType, wasteDescription, estimatedQuantity, pickupAddress,
      preferredDate, preferredTime, contactDetails
    });
    res.status(201).json(pickup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pickups/my - User's own pickups
exports.getMyPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ userId: req.user.id })
      .populate('assignedVolunteer', 'name email');
    res.json(pickups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pickups/open - Volunteers see open pickups
exports.getOpenPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ status: 'open' })
      .populate('userId', 'name location');
    res.json(pickups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pickups/assigned - Volunteer's accepted pickups
exports.getAssignedPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ assignedVolunteer: req.user.id })
      .populate('userId', 'name email');
    res.json(pickups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/pickups/:id/accept - Volunteer accepts pickup
exports.acceptPickup = async (req, res) => {
  try {
    const pickup = await PickupRequest.findById(req.params.id);
    if (!pickup || pickup.status !== 'open')
      return res.status(400).json({ message: 'Pickup not available' });

    pickup.status = 'accepted';
    pickup.assignedVolunteer = req.user.id;
    await pickup.save();

    await Notification.create({
      userId: pickup.userId,
      message: 'Your pickup request has been accepted by a volunteer',
      type: 'application'
    });

    res.json(pickup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/pickups/:id/complete - Volunteer marks as completed
exports.completePickup = async (req, res) => {
  try {
    const pickup = await PickupRequest.findById(req.params.id);
    if (!pickup || pickup.assignedVolunteer?.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    pickup.status = 'completed';
    await pickup.save();

    await Notification.create({
      userId: pickup.userId,
      message: 'Your pickup request has been completed!',
      type: 'application'
    });

    res.json(pickup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pickups/my-impact - User's completed waste breakdown by category
exports.getMyImpact = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const breakdown = await PickupRequest.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), status: 'completed' } },
      { $group: { _id: '$wasteType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const totalCompleted = breakdown.reduce((sum, b) => sum + b.count, 0);
    res.json({ totalCompleted, breakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/pickups/all - Admin views all pickups
exports.getAllPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find()
      .populate('userId', 'name email')
      .populate('assignedVolunteer', 'name email');
    res.json(pickups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
