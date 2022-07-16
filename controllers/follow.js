const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Follow = require("../models/Follow");

const User = require("../models/User");
const notificationService = require("../utils/notificationService");

// @desc      Send follow request
// @route     POST /api/v1/follow/user
// @access    Private
exports.follow = asyncHandler(async (req, res, next) => {
  const follow = await Follow.create({
    by: req.user.id,
    to: req.body.id,
    status: "PENDING",
  });

  await notificationService({
    type: "FOLLOW_REQUEST_EVENT",
    sender: req.user.id,
    receiver: req.body.id,
    message: `@${req.user.name} sent you a follow request.`,
    redirectId: req.user.id,
  });

  const r = await follow
    .populate("by", "_id name phone follower")
    .execPopulate();
  res.status(200).json({
    success: true,
    message: "Follow request sent successfully!",
    follow: r,
  });
});

// @desc      Get follow requests
// @route     GET /api/v1/follow
// @access    Private
exports.getFollowRequests = asyncHandler(async (req, res, next) => {
  const followRequests = await Follow.find({
    to: { $eq: req.user.id },
    status: { $eq: "PENDING" },
  }).populate("by", "name email");

  res.status(200).json({
    success: true,
    message: "Follow requests to a specific user",
    followRequests: followRequests,
  });
});

// @desc      Update follow request
// @route     POST /api/v1/follow
// @access    Private
exports.updateFollowStatus = asyncHandler(async (req, res, next) => {
  let follow = null;

  if (req.body.status === "ACCEPTED") {
    follow = await Follow.findOneAndUpdate(
      { by: req.body.followById, to: req.user.id },
      { status: "ACCEPTED" },
      { new: true }
    );
    await User.findByIdAndUpdate(follow.to, { $push: { follower: follow.by } });
    await User.findByIdAndUpdate(follow.by, { $push: { follower: follow.to } });
  } else if (req.body.status === "REJECTED") {
    await Follow.findOneAndDelete({ by: req.body.followById, to: req.user.id });
  } else {
    await Follow.findOneAndDelete({ by: req.body.followById, to: req.user.id });
  }

  await notificationService({
    type: "FOLLOW_RESPONSE_EVENT",
    sender: req.user.id,
    receiver: req.body.followById,
    message: `@${req.user.name} accepted your a follow request.`,
    redirectId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: `You ${req.body.status} follow request successfully`,
    follow: follow && follow.populate("by", "name email"),
  });
});
