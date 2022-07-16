const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Types.ObjectId,
    ref: "Course",
  },
  commentId: {
    type: mongoose.Types.ObjectId,
    ref: "Comment",
  },
  likes: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
  dislikes: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
  replies: [
    {
      body: {
        type: String,
        required: true,
      },
      sender: {
        name: {
          type: String,
        },
        phone: {
          type: String,
        },
        avatar: {
          type: String,
        },
      },
      isReply: {
        type: Boolean,
        default: true,
      },
    },
  ],
  isReply: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Comment", CommentSchema);
