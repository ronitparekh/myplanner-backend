import nodemailer from 'nodemailer';
import Event from '../models/eventModel.js';

// Configure transporter with more options
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // For local testing only (remove in production)
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

export const checkAndSendNotifications = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    console.log(`Checking for events between ${now} and ${oneHourLater}`);
    
    const events = await Event.find({
      date: {
        $gte: now,
        $lte: oneHourLater
      },
      notificationSent: false
    }).populate('user', 'email name');

    console.log(`Found ${events.length} events to notify`);
    
    for (const event of events) {
      try {
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
  const mailOptions = {
    from: `"Task Reminder" <${process.env.EMAIL_USER}>`,
    to: event.user.email,
    subject: `⏰ Reminder: ${event.text}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef9011;">Your event is coming up!</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Event:</strong> ${event.text}</p>
          <p><strong>Time:</strong> ${new Date(event.date).toLocaleString()}</p>
        </div>
        <p style="margin-top: 20px;">This is a reminder that your event starts in 1 hour.</p>
      </div>
    `,
    // Add text version for non-HTML clients
    text: `Reminder: ${event.text}\nTime: ${new Date(event.date).toLocaleString()}\n\nThis event starts in 1 hour.`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);
};