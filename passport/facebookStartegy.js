const FacebookStartegy = require("passport-facebook");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

facebookStartegy = function (passport) {
  passport.use(
    new FacebookStartegy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "/auth/facebook/callback",
        profileFields: ["id", "displayName", "photos", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log("profile", profile);
        console.log("accessToken", accessToken);
      }
    )
  );
};

module.exports = facebookStartegy;
