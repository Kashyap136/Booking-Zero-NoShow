import cron from "node-cron";
import Booking from "./models/bookingModel.js";
import Company from "./models/companyModel.js";
import { sendWhatsAppMessage } from "./controllers/whatsapp.js";
import { sendSMS } from "./utils.js";
import {
  buildSmsMessage,
  normalizeLanguage,
} from "./notifications/messages.js";

// bookingDate schema field is a "YYYY-MM-DD" string
const dateToKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

// ek booking ke liye WhatsApp bhejta hai, fail ho to SMS fallback
// WhatsApp language is read from the company's persisted language inside
// sendWhatsAppMessage; the SMS fallback builds its message in the same language.
const notifyBooking = async (booking, type) => {
  try {
    await sendWhatsAppMessage(booking._id, type);
    console.log(`[CRON] WhatsApp notification sent for booking ${booking._id}`);
  } catch (err) {
    console.warn(
      `WhatsApp failed for booking ${booking._id}, sending SMS instead:`,
      err.message
    );
    try {
      const company = await Company.findById(booking.companyId);
      const language = normalizeLanguage(company?.language);

      const message = buildSmsMessage({
        type,
        language,
        slot: booking.slot,
        companyId: booking.companyId,
      });

      await sendSMS(booking.phone, message);
    } catch (smsErr) {
      console.error(`SMS also failed for booking ${booking._id}:`, smsErr.message);
    }
  }
};

// JOB 1 - roz subah 8:00 AM - kal ki bookings ko reminder
const runTomorrowReminderJob = async () => {
  console.log("[CRON] Tomorrow reminder job started:", new Date().toISOString());

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      bookingDate: dateToKey(tomorrow),
      status: "booked",
    });

    console.log(`[CRON] ${bookings.length} bookings found for tomorrow reminder`);

    for (const booking of bookings) {
      await notifyBooking(booking, "reminder");
    }

    console.log("[CRON] Tomorrow reminder job completed");
  } catch (err) {
    console.error("[CRON] Tomorrow reminder job failed:", err.message);
  }
};

// JOB 2 - roz shaam 6:00 PM - aaj jo booking abhi bhi "booked" hai (customer nahi aaya)
const runTodayMissedJob = async () => {
  console.log("[CRON] Today missed job started:", new Date().toISOString());

  try {
    const today = new Date();

    const bookings = await Booking.find({
      bookingDate: dateToKey(today),
      status: "booked",
    });

    console.log(`[CRON] ${bookings.length} missed bookings found for today`);

    for (const booking of bookings) {
      await notifyBooking(booking, "no-show");
    }

    console.log("[CRON] Today missed job completed");
  } catch (err) {
    console.error("[CRON] Today missed job failed:", err.message);
  }
};

// dono cron jobs ko register karta hai - server start hote hi call hoga
export const startCronJobs = () => {
  cron.schedule("0 8 * * *", runTomorrowReminderJob); // roz subah 8 AM
  cron.schedule("0 18 * * *", runTodayMissedJob); // roz shaam 6 PM

  console.log("[CRON] Jobs registered: 8 AM reminder, 6 PM missed check");
};