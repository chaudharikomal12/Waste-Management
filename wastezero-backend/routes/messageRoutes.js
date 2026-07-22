const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messageController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, ctrl.sendMessage);
router.get('/contacts', auth, ctrl.getContacts);
router.get('/contactable-users', auth, ctrl.getContactableUsers);
router.get('/:userId', auth, ctrl.getConversation);

module.exports = router;
