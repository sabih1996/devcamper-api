const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio");
const client = new twilio(accountSid, authToken);

const twilioService = async (body, phone) => {
  client.messages
    .create({
      body: body,
      from: process.env.TWILIO__VERIFIED_NUMBER,
      to: phone,
    })
    .then((message) => console.log(message))
    .catch((err) => next(new ErrorResponse(err, 400)));
};

module.exports = twilioService;
