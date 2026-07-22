const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/applicationController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.post('/', auth, role('volunteer'), ctrl.applyForOpportunity);
router.get('/my', auth, role('volunteer'), ctrl.getMyApplications);
router.get('/opportunity/:id', auth, role('admin'), ctrl.getApplicationsForOpportunity);
router.put('/:id', auth, role('admin'), ctrl.updateApplicationStatus);

module.exports = router;
