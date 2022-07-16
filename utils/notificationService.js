const Follow = require("../models/Follow");
const Notification = require("../models/Notification");

const notificationService = async (body) => {
  await Notification.create(body);
};

module.exports = notificationService;
