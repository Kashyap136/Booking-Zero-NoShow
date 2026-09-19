// ---------------------------------------------------------------------------
// Single source of truth for notification message content.
// The company's persisted `language` (en | hi | mr) decides which template is
// used. Anything else falls back to English so notifications never break.
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = ["en", "hi", "mr"];

export const SUPPORTED_TYPES = ["confirmation", "reminder", "no-show", "upsell"];

export const normalizeLanguage = (value) =>
  SUPPORTED_LANGUAGES.includes(value) ? value : "en";

// Google Maps link in the plain `?q=lat,lng` form used by WhatsApp clients.
export const buildMapsLink = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat === 0 ||
    lng === 0
  ) {
    return null;
  }

  return `https://maps.google.com/?q=${lat},${lng}`;
};

const buildLocationBlock = (mapLink) =>
  mapLink ? `\n\n📍 Location:\n${mapLink}` : "";

// ---------------------------------------------------------------------------
// WhatsApp notification templates
// ---------------------------------------------------------------------------

const templates = {
  en: {
    confirmation: ({ customerName, companyName, serviceName, bookingDate, slot, mapLink }) =>
      `Hello ${customerName},

Your booking has been confirmed.

Company: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

📍 Location:
${mapLink}

Thank you!
${companyName}`,

    reminder: ({ customerName, companyName, serviceName, bookingDate, slot, mapLink }) =>
      `Hello ${customerName},

This is a reminder for your appointment.

Company: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

📍 Location:
${mapLink}

We look forward to seeing you!
${companyName}`,

    "no-show": ({ customerName, companyName, serviceName, bookingDate, slot }) =>
      `Hello ${customerName},

We noticed that you could not attend your appointment.

Company: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

Please contact us if you would like to book another appointment.

${companyName}`,

    upsell: ({ customerName, companyName, mapLink }) =>
      `Hello ${customerName},

Thank you for choosing ${companyName}.

We also have additional services available for you.

📍 Location:
${mapLink}

Please contact us for more information.

${companyName}`,
  },

  hi: {
    confirmation: ({ customerName, companyName, serviceName, bookingDate, slot, mapLink }) =>
      `नमस्ते ${customerName},

आपकी booking successfully confirm हो गई है।

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

📍 Location:
${mapLink}

धन्यवाद!
${companyName}`,

    reminder: ({ customerName, companyName, serviceName, bookingDate, slot, mapLink }) =>
      `नमस्ते ${customerName},

यह आपकी appointment का reminder है।

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

📍 Location:
${mapLink}

हम आपसे मिलने का इंतजार कर रहे हैं।

${companyName}`,

    "no-show": ({ customerName, companyName, serviceName, bookingDate, slot }) =>
      `नमस्ते ${customerName},

आप अपनी appointment पर उपस्थित नहीं हो सके।

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

नई appointment book करने के लिए हमसे संपर्क करें।

${companyName}`,

    upsell: ({ customerName, companyName, mapLink }) =>
      `नमस्ते ${customerName},

${companyName} को चुनने के लिए धन्यवाद।

हमारे पास आपके लिए कुछ additional services भी उपलब्ध हैं।

📍 Location:
${mapLink}

अधिक जानकारी के लिए हमसे संपर्क करें।

${companyName}`,
  },

  mr: {
    confirmation: ({ customerName, companyName, serviceName, bookingDate, slot, mapLink }) =>
      `नमस्कार ${customerName},

तुमची booking यशस्वीरित्या confirm झाली आहे.

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

📍 Location:
${mapLink}

धन्यवाद!
${companyName}`,

    reminder: ({ customerName, companyName, serviceName, bookingDate, slot, mapLink }) =>
      `नमस्कार ${customerName},

तुमच्या appointment साठी हा reminder आहे.

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

📍 Location:
${mapLink}

आम्ही तुम्हाला भेटण्याची वाट पाहत आहोत.

${companyName}`,

    "no-show": ({ customerName, companyName, serviceName, bookingDate, slot }) =>
      `नमस्कार ${customerName},

तुम्ही तुमच्या appointment ला उपस्थित राहू शकला नाहीत.

कंपनी: ${companyName}
Service: ${serviceName}
Date: ${bookingDate}
Time: ${slot}

नवीन appointment book करण्यासाठी आमच्याशी संपर्क साधा.

${companyName}`,

    upsell: ({ customerName, companyName, mapLink }) =>
      `नमस्कार ${customerName},

${companyName} निवडल्याबद्दल धन्यवाद.

आमच्याकडे तुमच्यासाठी काही additional services देखील उपलब्ध आहेत.

📍 Location:
${mapLink}

अधिक माहितीसाठी आमच्याशी संपर्क साधा.

${companyName}`,
  },
};

export const buildNotificationMessage = ({
  type,
  language,
  customerName = "Customer",
  companyName = "Our Company",
  serviceName = "Service",
  bookingDate,
  slot,
  mapLink,
}) => {
  const lang = normalizeLanguage(language);

  const template = templates[lang]?.[type];

  if (!template) {
    const err = new Error("Invalid type");
    err.status = 400;
    err.allowedTypes = SUPPORTED_TYPES;
    throw err;
  }

  return template({
    customerName,
    companyName,
    serviceName,
    bookingDate,
    slot,
    mapLink,
  });
};

// ---------------------------------------------------------------------------
// WhatsApp test-alert template
// ---------------------------------------------------------------------------

const testMessages = {
  en: (companyName) =>
    `This is a test message from ${companyName}. Your WhatsApp notifications are working correctly.`,
  hi: (companyName) =>
    `यह ${companyName} की ओर से एक टेस्ट संदेश है। आपके WhatsApp नोटिफिकेशन सही से काम कर रहे हैं।`,
  mr: (companyName) =>
    `हे ${companyName} कडून एक चाचणी संदेश आहे. तुमच्या WhatsApp सूचना योग्यरित्या कार्य करत आहेत.`,
};

export const buildTestMessage = ({
  language,
  companyName = "NoShow OS",
  mapLink,
}) =>
  testMessages[normalizeLanguage(language)](companyName) +
  buildLocationBlock(mapLink);

// ---------------------------------------------------------------------------
// SMS templates (sent via Fast2SMS as unicode text)
// ---------------------------------------------------------------------------

const smsTemplates = {
  en: {
    reminder: ({ slot, companyId }) =>
      `Reminder: Your booking is tomorrow at ${slot}. - ${companyId}`,
    "no-show": ({ slot }) =>
      `You missed your booking today at ${slot}. Advance has been charged.`,
  },
  hi: {
    reminder: ({ slot, companyId }) =>
      `याद दिलाना: आपकी booking कल है। Time: ${slot} - ${companyId}`,
    "no-show": ({ slot }) =>
      `आप आज की booking पर नहीं आए (Time: ${slot})। यह no-show माना गया है और advance charged किया गया है।`,
  },
  mr: {
    reminder: ({ slot, companyId }) =>
      `स्मरणपत्र: तुमची booking उद्या आहे. Time: ${slot} - ${companyId}`,
    "no-show": ({ slot }) =>
      `तुम्ही आजच्या booking ला उपस्थित राहिला नाहीत (Time: ${slot}). ही no-show मानली गेली आहे आणि advance आकारला आहे.`,
  },
};

export const buildSmsMessage = ({ type, language, slot, companyId }) => {
  const lang = normalizeLanguage(language);

  const template = smsTemplates[lang]?.[type];

  if (!template) {
    const err = new Error("Invalid SMS type");
    err.status = 400;
    throw err;
  }

  return template({ slot, companyId });
};

// Convenience guards re-exported so callers do not re-declare valid lists.
export const isValidType = (type) => SUPPORTED_TYPES.includes(type);
export const isValidLanguage = (value) => SUPPORTED_LANGUAGES.includes(value);