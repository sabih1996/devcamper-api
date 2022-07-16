const express = require("express");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notification");

const router = express.Router({ mergeParams: true });

const { protect } = require("../middleware/auth");

router
  .route("/")
  .get(protect, getUserNotifications)
  .put(protect, markAllAsRead);
router.route("/:id").put(protect, markAsRead);

module.exports = router;
