import axios from 'axios';

// Transport only. Message content is prepared by
// `Backend/notifications/messages.js` (buildSmsMessage) so the company's
// selected language is used. Fast2SMS is called with `language: 'unicode'`
// because Hindi/Marathi need Unicode text. Note: delivery of Hindi/Marathi
// depends on the FAST2SMS account and route ("q"/DLT) supporting Unicode;
// if the provider rejects Devanagari text the message is still sent but may
// be garbled on the handset.
export const sendSMS = async (phone, message) => {
  try {
    const body = message || 'Notification from booking system';

    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',              // 'q' = quick/transactional test route; use DLT route in production
        message: body,
        language: 'unicode',     // needed for Hindi/Marathi characters
        flash: 0,
        numbers: phone
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.return === true) {
      return { success: true };
    }
    console.warn('Fast2SMS returned failure:', response.data);
    return { success: false };
  } catch (err) {
    console.error('SMS send failed:', err.message);
    return { success: false };
  }
};