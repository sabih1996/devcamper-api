const express = require("express");
const {
  getCourses,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse,
  enrollUser,
  getCourseEnrolments,
} = require("../controllers/courses");

const Course = require("../models/Course");

const router = express.Router({ mergeParams: true });
const reviewRouter = require("./reviews");

const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");
router.use("/:bootcampId/reviews", reviewRouter);
router.route("/:course/enroll").put(protect, enrollUser);
router
  .route("/")
  .get(
    advancedResults(Course, {
      path: "bootcamp",
      select: "name description",
    }),
    getCourses
  )
  .post(protect, authorize("publisher", "admin"), addCourse);
router.route("/get-enrolments").get(protect, getCourseEnrolments);
router
  .route("/:id")
  .get(getCourse)
  .put(protect, authorize("publisher", "admin"), updateCourse)
  .delete(protect, authorize("publisher", "admin"), deleteCourse);

module.exports = router;
