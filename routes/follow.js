const express = require('express');
const { follow, getFollowRequests, updateFollowStatus} = require('../controllers/follow');

const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');

router.route('/').get(protect,getFollowRequests).post(protect,updateFollowStatus)
router.route('/user').post(protect,follow);

module.exports = router;