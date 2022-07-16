const express = require("express");
const {
  comment,
  getCourseComments,
  commentReply,
  deleteReply,
  updateReply,
  updateComment,
  deleteComment,
} = require("../controllers/comment");

const router = express.Router({ mergeParams: true });

const { protect } = require("../middleware/auth");

router.route("/").post(protect, comment);
router.route("/reply/:id").put(protect, commentReply);
router.route("/delete/:commentId").put(protect, deleteReply);
router.route("/update/:commentId").put(protect, updateReply);
router
  .route("/:id")
  .get(getCourseComments)
  .put(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;
