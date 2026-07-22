const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const PickupRequest = require('../models/PickupRequest');
const AdminLog = require('../models/AdminLog');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalVolunteers, totalOpportunities, totalApplications,
      pendingPickups, completedPickups, totalPickups] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'volunteer' }),
      Opportunity.countDocuments({ isDeleted: false }),
      Application.countDocuments(),
      PickupRequest.countDocuments({ status: 'open' }),
      PickupRequest.countDocuments({ status: 'completed' }),
      PickupRequest.countDocuments()
    ]);

    res.json({
      totalUsers, totalVolunteers, totalOpportunities, totalApplications,
      pendingPickups, completedPickups, totalPickups
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/suspend
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isSuspended = !user.isSuspended;
    await user.save();

    await AdminLog.create({
      adminId: req.user.id,
      action: user.isSuspended ? 'suspended_user' : 'activated_user',
      affectedUserId: user._id
    });

    res.json({ message: `User ${user.isSuspended ? 'suspended' : 'activated'}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/reports/users
exports.userReport = async (req, res) => {
  try {
    const total = await User.countDocuments({ role: 'user' });
    const active = await User.countDocuments({ role: 'user', isSuspended: false });
    const volunteers = await User.countDocuments({ role: 'volunteer' });
    res.json({ total, active, volunteers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/reports/pickups
exports.pickupReport = async (req, res) => {
  try {
    const total = await PickupRequest.countDocuments();
    const completed = await PickupRequest.countDocuments({ status: 'completed' });
    const pending = await PickupRequest.countDocuments({ status: 'open' });
    const accepted = await PickupRequest.countDocuments({ status: 'accepted' });
    res.json({ total, completed, pending, accepted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/reports/waste
exports.wasteReport = async (req, res) => {
  try {
    const byType = await PickupRequest.aggregate([
      { $group: { _id: '$wasteType', count: { $sum: 1 } } }
    ]);
    res.json(byType);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/reports/applications
exports.applicationReport = async (req, res) => {
  try {
    const total = await Application.countDocuments();
    const accepted = await Application.countDocuments({ status: 'accepted' });
    const rejected = await Application.countDocuments({ status: 'rejected' });
    const pending = await Application.countDocuments({ status: 'pending' });
    res.json({ total, accepted, rejected, pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/pickups/:id - Admin removes invalid/inappropriate pickup
exports.deletePickup = async (req, res) => {
  try {
    const pickup = await PickupRequest.findByIdAndDelete(req.params.id);
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

    await AdminLog.create({
      adminId: req.user.id,
      action: 'deleted_pickup',
      affectedUserId: pickup.userId
    });

    res.json({ message: 'Pickup request removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/reports/volunteers
exports.volunteerReport = async (req, res) => {
  try {
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const activeVolunteers = await User.countDocuments({ role: 'volunteer', isSuspended: false });

    const perVolunteer = await PickupRequest.aggregate([
      { $match: { status: 'completed', assignedVolunteer: { $ne: null } } },
      { $group: { _id: '$assignedVolunteer', completedCount: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'volunteer' } },
      { $unwind: '$volunteer' },
      { $project: { _id: 0, volunteerId: '$volunteer._id', name: '$volunteer.name', email: '$volunteer.email', completedCount: 1 } },
      { $sort: { completedCount: -1 } }
    ]);

    res.json({ totalVolunteers, activeVolunteers, perVolunteer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/logs
exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate('adminId', 'name')
      .populate('affectedUserId', 'name email')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
