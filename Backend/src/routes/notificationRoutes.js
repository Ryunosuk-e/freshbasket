const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getMyNotifications, markRead, markAllRead } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', authenticate, getMyNotifications);
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markRead);

module.exports = router;
