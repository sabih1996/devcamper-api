const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Review = require('../models/Review');
const Bootcamp = require('../models/Bootcamp');

// @desc      Get reviews
// @route     GET /api/v1/reviews
// @route     GET /api/v1/bootcamps/:bootcampId/reviews
// @access    Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      message:'Reviews related to bootcamp',
      count: reviews.length,
      data: reviews
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc      Get single review
// @route     GET /api/v1/reviews/:id
// @access    Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate('bootcamp','name description');
  
  if (!review) {
    return next(
      new ErrorResponse(`Reviews not found against bootcamp of id ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success:true,
    message:'get a single review',
    review:review
  })
});

// @desc      Add single review
// @route     POST /api/v1/bootamps/:bootcampId/reviews
// @access    Private
exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;
  
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`),
      404
    );
  }

  const review = await Review.create(req.body);
  
  res.status(200).json({
    success:true,
    message:'Review added successfully!',
    review:review
  })
});

// @desc      Update single review
// @route     PUT /api/v1/reviews/:id
// @access    Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  

  const review = await Review.findByIdAndUpdate(req.params.id,req.body,{
    new:true,
    runValidators: true
  });
  
  res.status(200).json({
    success:true,
    message:'Review updated successfully!',
    review:review
  })
});

// @desc      Delete review
// @route     DELETE /api/v1/reviews/:id
// @access    Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  
  const review = await Review.findByIdAndDelete(req.params.id)
  
  res.status(200).json({
    success:true,
    message:'Review updated successfully!',
    review:review
  })
});