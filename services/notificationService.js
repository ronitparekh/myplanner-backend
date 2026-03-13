import nodemailer from 'nodemailer';
import Event from '../models/eventModel.js';

const reminderToMinutes = {
  none: null,
  '5m': 5,
  '10m': 10,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '1d': 1440,
};

const emailEnabled = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// Configure transporter with more options
const transporter = emailEnabled
  ? nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // For local testing only (remove in production)
      },
    })
  : null;

if (transporter) {
  // Verify connection configuration
  transporter.verify((error) => {
    if (error) {
      console.error('SMTP Connection Error:', error);
    } else {
      console.log('Server is ready to send emails');
    }
  });
}

const getEventTitle = (event) => event.title || event.text || 'Upcoming event';

const getReminderLeadMinutes = (event) => {
  if (event.reminder === 'custom') {
    const customMinutes = Number(event.customReminderMinutes);
    return Number.isFinite(customMinutes) && customMinutes > 0 ? customMinutes : null;
  }

  if (Object.prototype.hasOwnProperty.call(reminderToMinutes, event.reminder)) {
    return reminderToMinutes[event.reminder];
  }

  return Number.isFinite(event.notifyBefore) ? event.notifyBefore : 60;
};

const getEventStart = (event) => {
  if (event.startDateTime) return new Date(event.startDateTime);
  return new Date(event.date);
};

export const checkAndSendNotifications = async () => {
  if (!emailEnabled || !transporter) return;
  try {
    const now = new Date();

    console.log(`Checking for reminders at ${now.toISOString()}`);

    const events = await Event.find({
      type: 'event',
      notificationSent: false,
    }).populate('user', 'email name');

    console.log(`Found ${events.length} events to notify`);
    
    for (const event of events) {
      try {
        const leadMinutes = getReminderLeadMinutes(event);
        if (leadMinutes === null) continue;

        const start = getEventStart(event);
        if (Number.isNaN(start.getTime())) continue;

        const reminderTime = new Date(start.getTime() - leadMinutes * 60 * 1000);

        if (start < now || reminderTime > now) {
          continue;
        }

        console.log(`Sending notification for event: ${event._id}`);
        await sendNotificationEmail(event);
        event.notificationSent = true;
        await event.save();
        console.log(`Notification sent for event: ${event._id}`);
      } catch (err) {
        console.error(`Failed to send notification for event ${event._id}:`, err);
      }
    }
  } catch (err) {
    console.error('Notification system error:', err);
  }
};

const sendNotificationEmail = async (event) => {
  if (!transporter) return;
  const title = getEventTitle(event);
  const start = getEventStart(event);
  const mailOptions = {
    from: `"Task Reminder" <${process.env.EMAIL_USER}>`,
    to: event.user.email,
    subject: `Reminder: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef9011;">Your event is coming up!</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Event:</strong> ${title}</p>
          <p><strong>Time:</strong> ${start.toLocaleString()}</p>
        </div>
        <p style="margin-top: 20px;">This is your scheduled reminder for the event.</p>
      </div>
    `,
    // Add text version for non-HTML clients
    text: `Reminder: ${title}\nTime: ${start.toLocaleString()}\n\nThis is your scheduled reminder for the event.`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
};