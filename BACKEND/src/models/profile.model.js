// src/models/profile.model.js
import mongoose, { Schema } from "mongoose";

const profileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Auth",          // Auth model se link
      required: true,
      unique: true,         // har user ka sirf 1 profile
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    avatar: {
      type: String,         // profile image ka URL
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 200,
    },

    // Zoom-type app ke liye useful fields:
    status: {
      type: String,
      enum: ["online", "offline", "busy", "in-call"],
      default: "offline",
    },

    lastSeen: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);

export { Profile };




/* 

// example: get profile with auth info
const profile = await Profile.findOne({ user: authUserId }).populate("user", "email username");

*/