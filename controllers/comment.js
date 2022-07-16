const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Comment = require("../models/Comment");
const notificationService = require("../utils/notificationService");
const { Types } = require("mongoose");

// @desc      add comment request
// @route     POST /api/v1/comment
// @access    Private

exports.comment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.create(req.body);
  const c = await comment
    .populate("sender", "_id name  phone follower")
    .execPopulate();

  res.status(200).json({
    success: true,
    message: "Comment created successfully!",
    comment: c,
  });
});

// @desc      update comment
// @route     PUT /api/v1/comment/:id
// @access    Private

exports.updateComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      body: req.body.body,
    },
    {
      new: true,
    }
  );
  const c = await comment
    .populate("sender", "_id name  phone follower")
    .execPopulate();

  res.status(200).json({
    success: true,
    message: "Comment updated successfully!",
    comment: c,
  });
});

// @desc      delete comment
// @route     DELETE /api/v1/comment/:id
// @access    Private

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Comment DELETED successfully!",
  });
});

// @desc      add comment reply
// @route     PUT /api/v1/comment/reply/:id
// @access    Private

exports.commentReply = asyncHandler(async (req, res, next) => {
  const reply = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      $push: { replies: req.body },
    },
    { new: true }
  );
  const commentReply = await reply
    .populate("sender", "_id name phone followers")
    .execPopulate();

  res.status(200).json({
    success: true,
    message: "Comment created successfully!",
    commentReply: commentReply,
  });
});

// @desc      update comment reply
// @route     PUT /api/v1/comment/delete/:commentId
// @access    Private

exports.updateReply = asyncHandler(async (req, res, next) => {
  const replyUpdated = await Comment.findByIdAndUpdate(
    req.params.commentId,
    {
      $set: { replies: { body: req.body.body } },
    },
    { new: true }
  );
  const commentReply = await replyUpdated
    .populate("sender", "_id name phone followers")
    .execPopulate();
  //methods with update one
  // {
  //   _id: new Types.ObjectId(req.params.commentId),
  //   "replies._id": new Types.ObjectId(req.body.replyId),
  // },
  // {
  //   $set: { "replies.$.body": req.body.body },
  // }
  // {
  //   _id: new Types.ObjectId(req.params.commentId),
  //   replies: {
  //     $elemMatch: { _id: { $eq: new Types.ObjectId(req.body.replyId) } },
  //   },
  // },
  // { $set: { "replies.$.body": req.body.body } }

  res.status(200).json({
    success: true,
    message: "Comment reply updated successfully!",
    replyUpdated: commentReply,
  });
});

// @desc      delete comment reply
// @route     PUT /api/v1/comment/delete/:commentId
// @access    Private

exports.deleteReply = asyncHandler(async (req, res, next) => {
  const reply = await Comment.findByIdAndUpdate(
    req.params.commentId,
    {
      $pull: { replies: { _id: new Types.ObjectId(req.body.replyId) } },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Comment reply deleted successfully!",
    replyDeleted: reply,
  });
});

// @desc get course comments and replies
// @route GET /api/v1/comment/:id
// @access public

exports.getCourseComments = asyncHandler(async (req, res, next) => {
  const comments = await Comment.aggregate([
    { $match: { course: new Types.ObjectId(req.params.id), isReply: false } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender",
      },
    },
    { $unwind: "$sender" },
    {
      $project: {
        _id: 1,
        body: 1,
        replies: 1,
        course: 1,
        "sender.name": 1,
        "sender.email": 1,
        "sender.phone": 1,
        "sender.avatar": 1,
      },
    },
  ]);
  res.status(200).json({
    success: true,
    comments: comments,
  });
});
