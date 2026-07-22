const Opportunity = require('../models/Opportunity');

// Verifies that req.user is the creator (ngo_id) of the opportunity in req.params.id
// Attaches the loaded opportunity to req.opportunity so controllers don't have to re-fetch it.
const verifyOpportunityOwnership = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    if (opportunity.ngo_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized: you do not own this opportunity' });
    }
    req.opportunity = opportunity;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error verifying ownership', error: err.message });
  }
};

module.exports = { verifyOpportunityOwnership };
