const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const FormationPointSchema = new mongoose.Schema(
  {
    x: {
      type: Number,
      required: true,
      min: 0,
      max: 720,
    },
    y: {
      type: Number,
      required: true,
      min: 0,
      max: 460,
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  formation: {
    type: [FormationPointSchema],
    required: true,
    validate: {
      validator(value) {
        return Array.isArray(value) && value.length === 10;
      },
      message: "Formation must contain exactly 10 player coordinates.",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
