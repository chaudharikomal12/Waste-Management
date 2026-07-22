const Opportunity = require('../models/Opportunity');
const Notification = require('../models/Notification');
const User = require('../models/User');

// POST /api/opportunities - Admin only
exports.createOpportunity = async (req, res) => {
  try {
    const { title, description, requiredSkills, duration, location } = req.body;
    if (!title || !description || !duration || !location) {
      return res.status(400).json({ message: 'Title, description, duration, and location are required' });
    }

    const opportunity = await Opportunity.create({
      title, description, requiredSkills, duration, location,
      ngo_id: req.user.id
    });

    // Notify volunteers whose skills or location match this new opportunity
    const matchingVolunteers = await User.find({
      role: 'volunteer',
      isSuspended: false,
      $or: [
        { skills: { $in: requiredSkills || [] } },
        { location: new RegExp(location, 'i') }
      ]
    }).select('_id');

    if (matchingVolunteers.length) {
      await Notification.insertMany(
        matchingVolunteers.map(v => ({
          userId: v._id,
          message: `New opportunity matching your profile: "${title}"`,
          type: 'opportunity'
        }))
      );
    }

    res.status(201).json(opportunity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/opportunities - Volunteers see open ones; Admin sees all non-deleted
exports.getOpportunities = async (req, res) => {
  try {
    const { location, skills, page = 1, limit = 10 } = req.query;
    let query = { isDeleted: false };

    if (req.user.role === 'volunteer') {
      query.status = 'open';
    }
    if (location) query.location = new RegExp(location, 'i');
    if (skills) query.requiredSkills = { $in: skills.split(',') };

    const opportunities = await Opportunity.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('ngo_id', 'name email');

    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/opportunities/:id - Admin (creator) only. Ownership already verified by middleware.
exports.updateOpportunity = async (req, res) => {
  try {
    const opp = req.opportunity;
    const { title, description, requiredSkills, duration, location, status } = req.body;

    if (!title || !description || !duration || !location) {
      return res.status(400).json({ message: 'Title, description, duration, and location are required' });
    }

    // ngo_id (creator) must never be changed via this endpoint
    opp.title = title;
    opp.description = description;
    opp.requiredSkills = requiredSkills || opp.requiredSkills;
    opp.duration = duration;
    opp.location = location;
    if (status) opp.status = status; // open, in-progress, closed

    await opp.save(); // updatedAt refreshes automatically via timestamps
    res.json(opp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/opportunities/:id - Soft delete. Ownership already verified by middleware.
exports.deleteOpportunity = async (req, res) => {
  try {
    const opp = req.opportunity;
    opp.isDeleted = true;
    await opp.save();
    res.json({ message: 'Opportunity deleted (soft)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/opportunities/:id - Single opportunity (used to pre-fill Edit form)
exports.getOpportunityById = async (req, res) => {
  try {
    const opp = await Opportunity.findOne({ _id: req.params.id, isDeleted: false })
      .populate('ngo_id', 'name email');
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/opportunities/match - Volunteer matching
exports.getMatchedOpportunities = async (req, res) => {
  try {
    const User = require('../models/User');
    const volunteer = await User.findById(req.user.id);
    const query = {
      isDeleted: false,
      status: 'open',
      $or: [
        { requiredSkills: { $in: volunteer.skills || [] } },
        { location: new RegExp(volunteer.location || '', 'i') }
      ]
    };
    const opportunities = await Opportunity.find(query).populate('ngo_id', 'name');
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
