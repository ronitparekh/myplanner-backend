import { checkAndSendNotifications } from './notificationService.js';
import cron from 'node-cron';

export const startScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log("Running")
    await checkAndSendNotifications();
  });
};