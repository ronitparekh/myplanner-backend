import { checkAndSendNotifications } from './notificationService.js';
import cron from 'node-cron';

export const startScheduler = () => {
  const emailEnabled = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  if (!emailEnabled) {
    console.log('Email notifications disabled (EMAIL_USER/EMAIL_PASS not set).');
    return;
  }

  // Run every minute
  cron.schedule('* * * * *', async () => {
    await checkAndSendNotifications();
  });
};