const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pickupController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.post('/', auth, role('user'), ctrl.createPickup);
router.get('/my', auth, role('user'), ctrl.getMyPickups);
router.get('/my-impact', auth, role('user'), ctrl.getMyImpact);
router.get('/open', auth, role('volunteer'), ctrl.getOpenPickups);
router.get('/assigned', auth, role('volunteer'), ctrl.getAssignedPickups);
router.put('/:id/accept', auth, role('volunteer'), ctrl.acceptPickup);
router.put('/:id/complete', auth, role('volunteer'), ctrl.completePickup);

module.exports = router;
