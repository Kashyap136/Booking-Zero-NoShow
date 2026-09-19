import axios from "axios";

import Booking from "../models/bookingModel.js";
import Company from "../models/companyModel.js";
import Service from "../models/serviceModel.js";

import {
  buildNotificationMessage,
  buildTestMessage,
  buildMapsLink,
  normalizeLanguage,
  isValidType,
} from "../notifications/messages.js";

export const sendWhatsAppMessage = async (bookingId, type) => {
  // -----------------------------
  // 1. Validate input
  // -----------------------------

  if (!isValidType(type)) {
    const err = new Error("Invalid type");
    err.status = 400;
    err.allowedTypes = ["confirmation", "reminder", "no-show", "upsell"];
    throw err;
  }

  // -----------------------------
  // 2. Find booking
  // -----------------------------

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }

  // -----------------------------
  // 3. Find company
  // -----------------------------

  const company = await Company.findById(booking.companyId);

  if (!company) {
    const err = new Error("Company not found");
    err.status = 404;
    throw err;
  }

  // -----------------------------
  // 4. Company location
  // -----------------------------

  const mapLink = buildMapsLink(company.latitude, company.longitude);

  if (!mapLink) {
    const err = new Error("Company location is not available");
    err.status = 400;
    throw err;
  }

  // -----------------------------
  // 5. Find service
  // -----------------------------

  const service = await Service.findById(booking.serviceId);

  // -----------------------------
  // 6. Customer phone
  // -----------------------------

  if (!booking.phone) {
    const err = new Error("Customer phone number not found");
    err.status = 400;
    throw err;
  }

  // -----------------------------
  // 7. Create message
  // The company's persisted `language` is the source of truth. A value that
  // is not en/hi/mr safely falls back to English inside the messages module.
  // -----------------------------

  const language = normalizeLanguage(company.language);

  const message = buildNotificationMessage({
    type,
    language,
    customerName: booking.customerName,
    companyName: company.name,
    serviceName: service?.title,
    bookingDate: booking.bookingDate,
    slot: booking.slot,
    mapLink,
  });

  // -----------------------------
  // 8. WhatsApp API
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
  // 9. Response
  // -----------------------------

  return {
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
      latitude: Number(company.latitude),
      longitude: Number(company.longitude),
    },

    mapLink,

    whatsappResponse: response.data,
  };
};

export const sendWhatsAppTest = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const company = await Company.findById(req.companyId);

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
      return res.status(500).json({
        success: false,
        message:
          "WhatsApp API credentials are not configured on the server (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN).",
      });
    }

    // The company's persisted `language` decides the test-message language.
    const language = normalizeLanguage(company.language);

    const body = buildTestMessage({
      language,
      companyName: company.name,
      mapLink: buildMapsLink(company.latitude, company.longitude),
    });

    const url =
      `https://graph.facebook.com/` +
      `${process.env.WHATSAPP_API_VERSION || "v23.0"}/` +
      `${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: {
          preview_url: true,
          body,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Test WhatsApp message sent",
      phone,
      language,
      mapLink: buildMapsLink(company.latitude, company.longitude),
      whatsappResponse: response.data,
    });
  } catch (error) {
    console.error("WhatsApp test error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.error?.message || error.message || "Server error",
    });
  }
};

export const sendWhatsApp = async (req, res) => {
  try {
    const { bookingId, type } = req.body;

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

    const result = await sendWhatsAppMessage(bookingId, type);

    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      const extra = {
        ...(error.allowedTypes ? { allowedTypes: error.allowedTypes } : {}),
      };

      return res.status(error.status).json({
        ...extra,
        message: error.message,
      });
    }

    console.error("WhatsApp Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.error?.message || error.message || "Server error",
    });
  }
};