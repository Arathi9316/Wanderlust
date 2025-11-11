const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
});
userSchema.plugin(passportLocalMongoose); //passportlocalmongoose automatically defines the username and hashing,hash password and salting value
module.exports = mongoose.model("User", userSchema);
//for using passport we used to install-
// passport,passport-local,passport-local-mongoose
