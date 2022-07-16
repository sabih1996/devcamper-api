const path = require("path");
const express = require("express");
const app = require("express")();
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");
const mongoSanitize = require("express-mongo-sanitize");
const server = require("http").createServer(app);
const cors = require("cors");
const io = require("socket.io")(server);
const passport = require("passport");

io.on("connection", (socket) => {
  console.log("connection successfully : " + socket.id);
  socket.on("send-notification", (data) => {
    socket.broadcast.emit("receive-notification", data);
  });
});

// Passport config
require("./passport/googleStartegy")(passport);
require("./passport/facebookStartegy")(passport);

app.use(cors());
// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

// Route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");
const follow = require("./routes/follow");
const notification = require("./routes/notification");
const comment = require("./routes/comment");

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

//Saniotize Data

app.use(mongoSanitize());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// File uploading
app.use(fileupload());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);
app.use("/api/v1/follow", follow);
app.use("/api/v1/notification", notification);
app.use("/api/v1/comment", comment);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const s = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
