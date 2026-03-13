import mongoose from "mongoose";

const reminderOptions = ["none", "5m", "10m", "15m", "30m", "1h", "1d", "custom"];
const repeatOptions = ["once", "daily", "weekly", "monthly", "weekdays", "custom"];

const eventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 🔗 Reference to User model
      required: true,
    },
    type: {
      type: String,
      enum: ["task", "event"],
      default: "event",
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String, // e.g., "14:30"
      default: "",
    },
    text: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    startDateTime: {
      type: Date,
      default: null,
    },
    endDateTime: {
      type: Date,
      default: null,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    calendarProvider: {
      type: String,
      trim: true,
      default: "Google Calendar",
    },
    repeat: {
      type: String,
      enum: repeatOptions,
      default: "once",
    },
    repeatCustom: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    reminder: {
      type: String,
      enum: reminderOptions,
      default: "1h",
    },
    customReminderMinutes: {
      type: Number,
      default: null,
    },
    guests: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    tag: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "",
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
