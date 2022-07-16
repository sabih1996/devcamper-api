const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");
const { Types } = require("mongoose");
const notificationService = require("../utils/notificationService");

// @desc      Get courses
// @route     GET /api/v1/courses
// @route     GET /api/v1/bootcamps/:bootcampId/courses
// @access    Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc      Get single course
// @route     GET /api/v1/courses/:id
// @access    Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc      Add course
// @route     POST /api/v1/bootcamps/:bootcampId/courses
// @access    Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`),
      404
    );
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`,
        401
      )
    );
  }

  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc      Enroll user to course
// @route     PUT /api/v1/courses/enroll
// @access    Private
exports.enrollUser = asyncHandler(async (req, res, next) => {
  console.log(req.params);
  const course = await Course.findByIdAndUpdate(
    new Types.ObjectId(req.params.course),
    {
      $push: { enrolments: req.body.user },
    },
    { new: true, runValidators: true }
  );

  await notificationService({
    type: "COURSE_SUBSCRIBE_EVENT",
    sender: course.user,
    receiver: new Types.ObjectId(req.body.user),
    message: `You are subscribed to course ${course.name} successfully`,
    redirectId: req.params.course,
  });

  res.status(200).json({
    success: true,
    data: `User registered to course ${course.title}`,
  });
});

// @desc      Get list of all users that are registered for specific course
// @route     GET /api/v1/courses/:course
// @access    Private
exports.getCourseEnrolments = asyncHandler(async (req, res, next) => {
  const enrolments = await Course.aggregate([
    { $match: { _id: new Types.ObjectId(req.body.course) } },
    {
      $lookup: {
        from: "users",
        localField: "enrolments",
        foreignField: "_id",
        as: "enrolments_info",
      },
    },
    {
      $project: {
        _id: 1,
        "enrolments_info.name": 1,
        "enrolments_info.email": 1,
        "enrolments_info.phone": 1,
        "enrolments_info.follower": 1,
      },
    },
  ]);

  // ]);
  // const enrolments = await Course.findById(req.params.course)
  //   .populate({
  //     path: "enrolments",
  //     populate: { path: "user", model: "users", select: "_id name " },
  //   })
  //   .exec();

  res.status(200).json({ success: true, data: enrolments });
});

// @desc      Update course
// @route     PUT /api/v1/courses/:id
// @access    Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  // Make sure user is course owner
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update course ${course._id}`,
        401
      )
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc      Delete course
// @route     DELETE /api/v1/courses/:id
// @access    Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  // Make sure user is course owner
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete course ${course._id}`,
        401
      )
    );
  }

  await course.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
