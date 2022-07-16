const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const Follow = require("../models/Follow");
const { Types } = require("mongoose");
const twilioService = require("../utils/twilioService");

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  const pin = Math.floor(1000 + Math.random() * 9000);
  // Create user

  await twilioService(
    `Your account is registered at devcamper.io. Your verification code is ${pin}`,
    phone
  );
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    verifyPin: pin,
  });
  sendTokenResponse(user, 200, res);
});

// @desc      Resend verification code by twilio if user did not received it
// @route     PUT /api/v1/auth/resend-pin
// @access    Public
exports.resendPin = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new ErrorResponse("Please enter your phone number", 401));
  }
  const pin = Math.floor(1000 + Math.random() * 9000);

  const user = await User.findOneAndUpdate(
    { phone: phone },
    {
      verifyPin: pin,
    },
    {
      new: true,
    }
  );
  if (!user) {
    return next(new ErrorResponse("Your phone number is not valid one", 401));
  }

  await twilioService(
    `Your new verification code is ${pin} at devcamper.io`,
    phone
  );

  res.status(200).json({
    success: true,
    message: "Verification code is sent to your mobile number",
    user: user,
  });
});

exports.yearlyGraph = asyncHandler(async (req, res, next) => {
  const $match = {
    $and: [
      { role: { $eq: req.query.type } },
      {
        createdAt: {
          $gte: new Date(`${req.query.year}-01-01`),
          $lte: new Date(`${req.query.year}-12-31`),
        },
      },
    ],
  };

  const data = await User.aggregate([
    {
      $facet: {
        usersCount: [
          {
            $match,
          },
          {
            $group: {
              _id: {
                month: {
                  $month: "$createdAt",
                },
                year: {
                  $year: "$createdAt",
                },
              },
              count: {
                $sum: 1,
              },
            },
          },
        ],
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "users or publishers yearly graph data",
    data: data,
  });
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate emil & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user.isVerified) {
    return next(new ErrorResponse("Your account is not verified yet", 401));
  }

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Get list of all users
// @route     POST /api/v1/auth/users
// @access    Private
exports.getUsers = asyncHandler(async (req, res, next) => {
  let queryArr = [];
  let query = null;
  const resPerPage = 8;
  const page = Number(req.query.page) || 1;

  queryArr.push({
    $and: [
      {
        role: { $in: ["user", "publisher"] },
      },
      { _id: { $ne: new Types.ObjectId(req.user._id) } },
    ],
  });
  query = {
    $and: [...queryArr],
  };

  if (req.query.search && req.query.search != "") {
    queryArr.push({
      $and: [
        {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        },
        {
          role: { $in: ["user", "publisher"] },
        },
        { _id: { $ne: new Types.ObjectId(req.user._id) } },
      ],
    });
    query = {
      $and: [...queryArr],
    };
  }

  const users = await User.find(query)
    .skip(resPerPage * page - resPerPage)
    .limit(resPerPage);

  let userCount = 0;
  let data = [];
  let promises = [];

  promises.push(
    User.countDocuments(query).then((count) => {
      userCount = count;
    })
  );

  users.forEach((item) => {
    promises.push(
      Follow.findOne({
        $or: [
          { by: new Types.ObjectId(req.user._id), to: item._id },
          { to: new Types.ObjectId(req.user._id), by: item._id },
        ],
      }).then((follow) => {
        let object = {
          ...item.toJSON(),
          requestSent: follow && follow.status == "PENDING" ? true : false,
          followed: follow && follow.status == "ACCEPTED" ? true : false,
          reqBy: follow ? follow.by : "",
        };
        data.push(object);
      })
    );
  });
  await Promise.all(promises);
  res.status(200).json({
    users: data,
    current_page: Number(page),
    pages: Math.ceil(userCount / resPerPage),
    total_users: userCount,
    per_page: resPerPage,
  });
});

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc      Forgot password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("There is no user with that email", 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent", 500));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc      Verify account
// @route     PUT /api/v1/auth/verify
// @access    Public
exports.verifyAccount = asyncHandler(async (req, res, next) => {
  let user = await User.findOne({ verifyPin: req.body.pin });

  if (!user) {
    return next(
      new ErrorResponse(
        "Invalid verification code, please enter a valid one",
        400
      )
    );
  }
  user.isVerified = true;
  user = await user.save();

  res.status(200).json({
    success: true,
    message: "Your account is verified successfully",
    user: user,
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};
