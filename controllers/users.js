const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const { Types } = require("mongoose");

// @desc      Get all users and publishers
// @route     GET /api/v1/auth/users
// @access    Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  let queryArr = [];
  let query = null;
  const resPerPage = 8;
  const page = Number(req.query.page) || 1;

  queryArr.push({
    $or: [
      {
        role: { $eq: req.query.type },
      },
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
          role: { $eq: req.query.type },
        },
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
  let promises = [];

  promises.push(
    User.countDocuments(query).then((count) => {
      userCount = count;
    })
  );

  await Promise.all(promises);
  res.status(200).json({
    users: users,
    current_page: Number(page),
    pages: Math.ceil(userCount / resPerPage),
    total_users: userCount,
    per_page: resPerPage,
  });
});

// @desc      Get single user
// @route     GET /api/v1/auth/users/:id
// @access    Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Create user
// @route     POST /api/v1/auth/users
// @access    Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Ban/UnBan User or publisher
// @route     PUT /api/v1/auth/users/toggle-ban
// @access    Private/Admin
exports.toggleBan = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.body.user);

  const u = await User.findByIdAndUpdate(
    new Types.ObjectId(req.body.user),
    { isBanned: !user.isBanned },
    { new: true }
  );
  res.status(200).json({
    success: true,
    message: `User ${u.isBanned ? "banned" : "unbanned"} successfully`,
    data: u,
  });
});

// @desc      Toggle role
// @route     PUT /api/v1/users/toggle-role
// @access    Private/Admin
exports.toggleRole = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    new Types.ObjectId(req.body.user),
    { role: req.body.role === "publisher" ? "publisher" : "user" },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: `User role updated successfully`,
    data: user,
  });
});

// @desc      Delete user
// @route     DELETE /api/v1/auth/users/:id
// @access    Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
