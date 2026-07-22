const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const Notification = require('../models/Notification');

// POST /api/applications - Volunteer applies
exports.applyForOpportunity = async (req, res) => {
  try {
    const { opportunity_id } = req.body;
    const opp = await Opportunity.findById(opportunity_id);
    if (!opp || opp.isDeleted) return res.status(404).json({ message: 'Opportunity not found' });
    if (opp.status !== 'open') return res.status(400).json({ message: 'Opportunity is not open' });

    const existing = await Application.findOne({ opportunity_id, volunteer_id: req.user.id });
    if (existing) return res.status(409).json({ message: 'Already applied' });

    const application = await Application.create({
      opportunity_id,
      volunteer_id: req.user.id
    });

    // Notify admin
    await Notification.create({
      userId: opp.ngo_id,
      message: `New application received for "${opp.title}"`,
      type: 'application'
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/applications/my - Volunteer's own applications
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ volunteer_id: req.user.id })
      .populate('opportunity_id', 'title location status');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/applications/opportunity/:id - Admin views applications for their opportunity
exports.getApplicationsForOpportunity = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp || opp.ngo_id.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const apps = await Application.find({ opportunity_id: req.params.id })
      .populate('volunteer_id', 'name email location skills');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/applications/:id - Admin accepts/rejects
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findById(req.params.id).populate('opportunity_id');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    if (app.opportunity_id.ngo_id.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    app.status = status;
    await app.save();

    // Notify volunteer
    await Notification.create({
      userId: app.volunteer_id,
      message: `Your application for "${app.opportunity_id.title}" has been ${status}`,
      type: 'application'
    });

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
