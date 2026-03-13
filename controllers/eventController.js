import Event from "../models/eventModel.js";
import moment from 'moment-timezone';

const DEFAULT_TIMEZONE = "UTC";
const reminderToMinutes = {
  none: null,
  "5m": 5,
  "10m": 10,
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "1d": 1440,
};

const parseDateOnly = (value, timezone) => {
  if (!value) return null;

  const parsed = moment.tz(value, ["YYYY-MM-DD", moment.ISO_8601], timezone).startOf("day");
  return parsed.isValid() ? parsed.toDate() : null;
};

const parseDateTime = (value, timezone) => {
  if (!value) return null;

  const parsed = moment.tz(value, moment.ISO_8601, timezone);
  return parsed.isValid() ? parsed.toDate() : null;
};

const sanitizeGuests = (guests) => {
  if (Array.isArray(guests)) {
    return guests.map((guest) => String(guest).trim()).filter(Boolean);
  }

  if (typeof guests === "string") {
    return guests
      .split(/[\n,]/)
      .map((guest) => guest.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeReminder = (reminder, customReminderMinutes) => {
  if (reminder === "custom") {
    const parsedMinutes = Number(customReminderMinutes);

    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      throw new Error("Custom reminder must be a positive number of minutes.");
    }

    return {
      reminder: "custom",
      customReminderMinutes: Math.round(parsedMinutes),
      notifyBefore: Math.round(parsedMinutes),
    };
  }

  const normalizedReminder = Object.prototype.hasOwnProperty.call(reminderToMinutes, reminder)
    ? reminder
    : "1h";

  return {
    reminder: normalizedReminder,
    customReminderMinutes: null,
    notifyBefore: reminderToMinutes[normalizedReminder] ?? 60,
  };
};

const formatModelDate = (value, timezone) => {
  if (!value) return null;
  return moment(value).tz(timezone || DEFAULT_TIMEZONE).format();
};

const serializeEvent = (event) => {
  const timezone = event.timezone || DEFAULT_TIMEZONE;

  return {
    ...event._doc,
    title: event.title || event.text || "",
    text: event.text || event.title || "",
    date: formatModelDate(event.date, timezone),
    startDateTime: formatModelDate(event.startDateTime, timezone),
    endDateTime: formatModelDate(event.endDateTime, timezone),
    localTime: event.time,
    guests: Array.isArray(event.guests) ? event.guests : [],
  };
};

const buildEventPayload = (input, existingEvent = null) => {
  const timezone = input.timezone || existingEvent?.timezone || DEFAULT_TIMEZONE;
  const type = input.type === "task" ? "task" : "event";
  const title = String(input.title ?? input.text ?? existingEvent?.title ?? existingEvent?.text ?? "").trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  const dateInput = input.date ?? existingEvent?.date;
  const baseDate = parseDateOnly(dateInput, timezone);

  if (!baseDate) {
    throw new Error("Date is required.");
  }

  const allDay = type === "event" ? Boolean(input.allDay ?? existingEvent?.allDay) : false;
  const rawStartDateTime = input.startDateTime ?? existingEvent?.startDateTime ?? null;
  const rawEndDateTime = input.endDateTime ?? existingEvent?.endDateTime ?? null;
  const startDateTime = allDay || type === "task" ? null : parseDateTime(rawStartDateTime, timezone);
  const endDateTime = allDay || type === "task" ? null : parseDateTime(rawEndDateTime, timezone);
  const fallbackTime = typeof (input.time ?? existingEvent?.time) === "string"
    ? (input.time ?? existingEvent?.time).trim()
    : "";

  let effectiveDate = baseDate;
  let time = fallbackTime;

  if (type === "event") {
    if (allDay) {
      time = "All day";
    } else if (!startDateTime || !endDateTime) {
      throw new Error("Start and end date/time are required for timed events.");
    } else {
      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after the start time.");
      }

      effectiveDate = startDateTime;
      time = moment(startDateTime).tz(timezone).format("HH:mm");
    }
  } else if (fallbackTime) {
    const parsedTaskDateTime = moment.tz(
      `${moment(baseDate).tz(timezone).format("YYYY-MM-DD")} ${fallbackTime}`,
      "YYYY-MM-DD HH:mm",
      timezone
    );

    if (parsedTaskDateTime.isValid()) {
      effectiveDate = parsedTaskDateTime.toDate();
      time = parsedTaskDateTime.format("HH:mm");
    }
  }

  const reminderState = type === "event"
    ? normalizeReminder(input.reminder ?? existingEvent?.reminder ?? "1h", input.customReminderMinutes ?? existingEvent?.customReminderMinutes)
    : { reminder: "none", customReminderMinutes: null, notifyBefore: null };

  return {
    type,
    title,
    text: title,
    date: effectiveDate,
    time,
    startDateTime,
    endDateTime,
    allDay,
    calendarProvider: type === "event"
      ? String(input.calendarProvider ?? existingEvent?.calendarProvider ?? "Google Calendar").trim() || "Google Calendar"
      : "",
    repeat: type === "event" ? String(input.repeat ?? existingEvent?.repeat ?? "once") : "once",
    repeatCustom: type === "event" ? String(input.repeatCustom ?? existingEvent?.repeatCustom ?? "").trim() : "",
    reminder: reminderState.reminder,
    customReminderMinutes: reminderState.customReminderMinutes,
    guests: type === "event" ? sanitizeGuests(input.guests ?? existingEvent?.guests ?? []) : [],
    location: type === "event" ? String(input.location ?? existingEvent?.location ?? "").trim() : "",
    description: String(input.description ?? existingEvent?.description ?? "").trim(),
    tag: String(input.tag ?? existingEvent?.tag ?? "").trim(),
    done: Boolean(input.done ?? existingEvent?.done ?? false),
    notifyBefore: reminderState.notifyBefore,
    notificationSent: false,
    timezone,
  };
};

// @desc    Create a new event (in IST)
// @route   POST /api/events
export const createEvent = async (req, res) => {
  try {
    const payload = buildEventPayload(req.body);
    const event = await Event.create({
      ...payload,
      user: req.user._id,
    });

    res.status(201).json(serializeEvent(event));
  } catch (err) {
    res.status(400).json({ message: "Failed to create event", error: err.message });
  }
};

// @desc    Get events for current user (in IST)
// @route   GET /api/events
export const getUserEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort("date");

    res.status(200).json(events.map((event) => serializeEvent(event)));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events", error: err.message });
  }
};

// @desc    Update an event (in IST)
// @route   PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const payload = buildEventPayload(req.body, event);

    Object.assign(event, payload);
    const updated = await event.save();

    res.status(200).json(serializeEvent(updated));
  } catch (err) {
    res.status(400).json({ message: "Failed to update event", error: err.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete event", error: err.message });
  }
};