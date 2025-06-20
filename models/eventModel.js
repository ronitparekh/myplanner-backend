import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 🔗 Reference to User model
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String, // e.g., "14:30"
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 100,
    },
    done: {
      type: Boolean,
      default: false,
    },
    notifyBefore: {
      type: Number, // minutes before event
      default: 60 // 1 hour
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata"
    }
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
