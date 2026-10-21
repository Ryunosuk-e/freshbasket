const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getMyProfile, updateMyProfile } = require('../controllers/customerController');

const router = express.Router();

router.get('/me', authenticate, authorize('customer'), getMyProfile);
router.patch('/me', authenticate, authorize('customer'), updateMyProfile);

module.exports = router;
