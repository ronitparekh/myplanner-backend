import Event from "../models/eventModel.js";
import moment from 'moment-timezone';

// @desc    Create a new event (in IST)
// @route   POST /api/events
export const createEvent = async (req, res) => {
  try {
    const { date, time, text, tag } = req.body;

    // Convert input date to IST timezone
    const istDate = moment.tz(date, "Asia/Kolkata").toDate();
    
    const event = await Event.create({
      user: req.user._id,
      date: istDate,  // Store as UTC but representing IST time
      time,
      text,
      tag,
      timezone: "Asia/Kolkata"  // Store the timezone
    });

    res.status(201).json({
      ...event._doc,
      localDate: moment(event.date).tz("Asia/Kolkata").format(), // Return IST representation
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create event", error: err.message });
  }
};

// @desc    Get events for current user (in IST)
// @route   GET /api/events
export const getUserEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort("date");
    
    // Convert dates to IST before sending to client
    const eventsWithIST = events.map(event => ({
      ...event._doc,
      date: moment(event.date).tz("Asia/Kolkata").format(),
      localTime: event.time // Already stored as string
    }));
    
    res.status(200).json(eventsWithIST);
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

    // Convert date to IST if being updated
    if (req.body.date) {
      req.body.date = moment.tz(req.body.date, "Asia/Kolkata").toDate();
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { 
      new: true 
    });
    
    res.status(200).json({
      ...updated._doc,
      date: moment(updated.date).tz("Asia/Kolkata").format()
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update event", error: err.message });
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