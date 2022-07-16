const asyncHandler = require("../middleware/async");
const Notification = require("../models/Notification");
const { Types } = require("mongoose");

exports.getUserNotifications = asyncHandler(async (req, res, next) => {
  const searchFilter =
    req.body.type !== ""
      ? {
          receiver: new Types.ObjectId(req.user.id),
          markRead: false,
          type: req.body.type,
        }
      : {
          receiver: new Types.ObjectId(req.user.id),
          markRead: false,
        };

  const notifications = await Notification.find(searchFilter)
    .sort({ createdAt: -1 })
    .populate("sender", "_id name phone");

  res.status(200).json({
    success: true,
    message: "user notifications",
    notifications: notifications,
  });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      markRead: true,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "You read notification successfully",
    notification: notification,
  });
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { $or: [{ receiver: req.user.id }, { sender: req.user.id }] },
    { markRead: true }
  );
  res.status(200).json({
    success: true,
    message: "read all notifications successfully",
  });
});
