const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/opportunityController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { verifyOpportunityOwnership } = require('../middleware/ownershipMiddleware');

router.get('/match', auth, role('volunteer'), ctrl.getMatchedOpportunities);
router.get('/:id', auth, ctrl.getOpportunityById);
router.get('/', auth, ctrl.getOpportunities);
router.post('/', auth, role('admin'), ctrl.createOpportunity);
router.put('/:id', auth, role('admin'), verifyOpportunityOwnership, ctrl.updateOpportunity);
router.delete('/:id', auth, role('admin'), verifyOpportunityOwnership, ctrl.deleteOpportunity);

module.exports = router;
