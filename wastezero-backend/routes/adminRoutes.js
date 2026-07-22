const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const pickupCtrl = require('../controllers/pickupController');

router.use(auth, role('admin'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.getAllUsers);
router.put('/users/:id/suspend', ctrl.suspendUser);
router.get('/reports/users', ctrl.userReport);
router.get('/reports/pickups', ctrl.pickupReport);
router.get('/reports/waste', ctrl.wasteReport);
router.get('/reports/volunteers', ctrl.volunteerReport);
router.get('/reports/applications', ctrl.applicationReport);
router.get('/logs', ctrl.getAdminLogs);
router.get('/pickups', pickupCtrl.getAllPickups);
router.delete('/pickups/:id', ctrl.deletePickup);

module.exports = router;
