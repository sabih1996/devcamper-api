const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleBan,
  toggleRole,
} = require("../controllers/users");

const User = require("../models/User");

const router = express.Router({ mergeParams: true });

const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.use(authorize("admin"));

router.route("/").get(advancedResults(User), getUsers).post(createUser);
router.route("/toggle-ban").put(toggleBan);
router.route("/toggle-role").put(toggleRole);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
