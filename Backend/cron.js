import cron from 'node-cron';
import Booking from './models/bookingModel.js';
import { sendWhatsAppMessage } from './controllers/whatsapp.js';
import { sendSMS } from './utils/sms.js';

// helper - din ke start (00:00:00) se end (23:59:59) tak ka range banata hai
const getDateRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ek booking ke liye WhatsApp bhejta hai, fail ho to SMS fallback
const notifyBooking = async (booking, type) => {
  try {
    const result = await sendWhatsAppMessage(booking._id, type);

    if (!result.success) {
      console.warn(`WhatsApp failed for booking ${booking._id}, sending SMS instead`);
      await sendSMS(booking.phone, type, booking);
    }
  } catch (err) {
    console.error(`Notification failed for booking ${booking._id}:`, err.message);
    // ek booking fail ho to poora loop nahi rukna chahiye
  }
};

// JOB 1 - roz subah 8:00 AM - kal ki bookings ko reminder
const runTomorrowReminderJob = async () => {
  console.log('[CRON] Tomorrow reminder job started:', new Date().toISOString());

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { start, end } = getDateRange(tomorrow);

    const bookings = await Booking.find({
      bookingDate: { $gte: start, $lte: end },
      status: 'booked'
    });

    console.log(`[CRON] ${bookings.length} bookings found for tomorrow reminder`);

    for (const booking of bookings) {
      await notifyBooking(booking, 'reminder');
    }

    console.log('[CRON] Tomorrow reminder job completed');
  } catch (err) {
    console.error('[CRON] Tomorrow reminder job failed:', err.message);
  }
};

// JOB 2 - roz shaam 6:00 PM - aaj jo booking abhi bhi "booked" hai (customer nahi aaya)
const runTodayMissedJob = async () => {
  console.log('[CRON] Today missed job started:', new Date().toISOString());

  try {
    const today = new Date();
    const { start, end } = getDateRange(today);

    const bookings = await Booking.find({
      bookingDate: { $gte: start, $lte: end },
      status: 'booked'
    });

    console.log(`[CRON] ${bookings.length} missed bookings found for today`);

    for (const booking of bookings) {
      await notifyBooking(booking, 'no-show');
    }

    console.log('[CRON] Today missed job completed');
  } catch (err) {
    console.error('[CRON] Today missed job failed:', err.message);
  }
};

// dono cron jobs ko register karta hai - server start hote hi call hoga
export const startCronJobs = () => {
  cron.schedule('0 8 * * *', runTomorrowReminderJob);  // roz subah 8 AM
  cron.schedule('0 18 * * *', runTodayMissedJob);       // roz shaam 6 PM

  console.log('[CRON] Jobs registered: 8 AM reminder, 6 PM missed check');
};