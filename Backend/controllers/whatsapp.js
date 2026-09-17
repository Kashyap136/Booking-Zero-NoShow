import axios from "axios";

import Booking from "../models/bookingModel.js";
import Company from "../models/companyModel.js";
import Service from "../models/serviceModel.js";

export const sendWhatsApp = async (req, res) => {
  try {
    const { bookingId, type, language = "en" } = req.body;

    // -----------------------------
    // 1. Validate input
    // -----------------------------

    if (!bookingId) {
      return res.status(400).json({
        message: "bookingId is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        message: "type is required",
      });
    }

    const allowedTypes = ["confirmation", "reminder", "no-show", "upsell"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid type",
        allowedTypes,
      });
    }

    const allowedLanguages = ["en", "hi", "mr"];

    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({
        message: "Invalid language",
        allowedLanguages,
      });
    }

    // -----------------------------
    // 2. Find booking
    // -----------------------------

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }
    console.log("FULL BOOKING:", booking);
console.log("booking.companyId:", booking.companyId);

    // -----------------------------
    // 3. Find company
    // -----------------------------

    const company = await Company.findById(booking.companyId);
    console.log("companayId is ", company);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // -----------------------------
    // 4. Company location
    // -----------------------------

    const latitude = Number(company.latitude);
    const longitude = Number(company.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        message: "Company location is not available",
      });
    }

    // -----------------------------
    // 5. Google Maps link
    // -----------------------------

    const mapLink =
      `https://www.google.com/maps/search/?api=1&query=` +
      `${encodeURIComponent(`${latitude},${longitude}`)}`;

    // -----------------------------
    // 6. Find service
    // -----------------------------

    const service = await Service.findById(booking.serviceId);

    // -----------------------------
    // 7. Customer phone
    // -----------------------------

    if (!booking.phone) {
      return res.status(400).json({
        message: "Customer phone number not found",
      });
    }

    // -----------------------------
    // 8. Create message
    // -----------------------------

    let message = "";

    const customerName = booking.customerName || "Customer";

    const companyName = company.name || "Our Company";

    const serviceName = service?.name || "Service";

    // =============================
    // ENGLISH
    // =============================

    if (language === "en") {
      if (type === "confirmation") {
        message = `Hello ${customerName},

Your booking has been confirmed.

Company: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

📍 Location:
${mapLink}

Thank you!
${companyName}`;
      }

      if (type === "reminder") {
        message = `Hello ${customerName},

This is a reminder for your appointment.

Company: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

📍 Location:
${mapLink}

We look forward to seeing you!
${companyName}`;
      }

      if (type === "no-show") {
        message = `Hello ${customerName},

We noticed that you could not attend your appointment.

Company: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

Please contact us if you would like to book another appointment.

${companyName}`;
      }

      if (type === "upsell") {
        message = `Hello ${customerName},

Thank you for choosing ${companyName}.

We also have additional services available for you.

📍 Location:
${mapLink}

Please contact us for more information.

${companyName}`;
      }
    }

    // =============================
    // HINDI
    // =============================

    if (language === "hi") {
      if (type === "confirmation") {
        message = `नमस्ते ${customerName},

आपकी booking successfully confirm हो गई है।

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

📍 Location:
${mapLink}

धन्यवाद!
${companyName}`;
      }

      if (type === "reminder") {
        message = `नमस्ते ${customerName},

यह आपकी appointment का reminder है।

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

📍 Location:
${mapLink}

हम आपसे मिलने का इंतजार कर रहे हैं।

${companyName}`;
      }

      if (type === "no-show") {
        message = `नमस्ते ${customerName},

आप अपनी appointment पर उपस्थित नहीं हो सके।

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

नई appointment book करने के लिए हमसे संपर्क करें।

${companyName}`;
      }

      if (type === "upsell") {
        message = `नमस्ते ${customerName},

${companyName} को चुनने के लिए धन्यवाद।

हमारे पास आपके लिए कुछ additional services भी उपलब्ध हैं।

📍 Location:
${mapLink}

अधिक जानकारी के लिए हमसे संपर्क करें।

${companyName}`;
      }
    }

    // =============================
    // MARATHI
    // =============================

    if (language === "mr") {
      if (type === "confirmation") {
        message = `नमस्कार ${customerName},

तुमची booking यशस्वीरित्या confirm झाली आहे.

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

📍 Location:
${mapLink}

धन्यवाद!
${companyName}`;
      }

      if (type === "reminder") {
        message = `नमस्कार ${customerName},

तुमच्या appointment साठी हा reminder आहे.

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

📍 Location:
${mapLink}

आम्ही तुम्हाला भेटण्याची वाट पाहत आहोत.

${companyName}`;
      }

      if (type === "no-show") {
        message = `नमस्कार ${customerName},

तुम्ही तुमच्या appointment ला उपस्थित राहू शकला नाहीत.

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${booking.bookingDate}
Time: ${booking.slot}

नवीन appointment book करण्यासाठी आमच्याशी संपर्क साधा.

${companyName}`;
      }

      if (type === "upsell") {
        message = `नमस्कार ${customerName},

${companyName} निवडल्याबद्दल धन्यवाद.

आमच्याकडे तुमच्यासाठी काही additional services देखील उपलब्ध आहेत.

📍 Location:
${mapLink}

अधिक माहितीसाठी आमच्याशी संपर्क साधा.

${companyName}`;
      }
    }

    // -----------------------------
    // 9. WhatsApp API
    // -----------------------------

    const url =
      `https://graph.facebook.com/` +
      `${process.env.WHATSAPP_API_VERSION || "v23.0"}/` +
      `${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: booking.phone,
        type: "text",
        text: {
          preview_url: true,
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    // -----------------------------
    // 10. Response
    // -----------------------------

    return res.status(200).json({
      success: true,
      message: "WhatsApp message sent successfully",

      bookingId: booking._id,

      type,
      language,

      customer: {
        name: booking.customerName,
        phone: booking.phone,
      },

      company: {
        name: company.name,
        latitude,
        longitude,
      },

      mapLink,

      whatsappResponse: response.data,
    });
  } catch (error) {
    console.error("WhatsApp Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.error?.message || error.message || "Server error",
    });
  }
};
