import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Company from "../models/companyModel.js";

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check email
    const existingCompany = await Company.findOne({
      email: cleanEmail,
    });

    if (existingCompany) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    // Hash password
    const Password = await bcrypt.hash(password, 12);

    // Create company
    const company = await Company.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      Password,
    });

    const companyId = company._id.toString();

    // Token
    const token = jwt.sign(
      {
        companyId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(201).json({
      message: "Registration successful",

      token,

      user: {
        id: companyId,
        name: company.name,
        email: company.email,
        role: "admin",
        companyId,
      },

      company: {
        id: companyId,
        name: company.name,
      },
    });
  } catch (error) {
    console.log("Register error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Clean email same as register
    const cleanEmail = email.trim().toLowerCase();

    // Find company
    const company = await Company.findOne({
      email: cleanEmail,
    });

    if (!company) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    // Register saves hashed password in `Password`
    const passwordCorrect = await bcrypt.compare(
      password,
      company.Password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const companyId = company._id.toString();

    // Generate token
    const token = jwt.sign(
      {
        companyId,
        role: company.role || "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
        algorithm: "HS256",
      }
    );

    return res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: companyId,
        name: company.name,
        email: company.email,
        role: company.role || "admin",
        companyId,
      },

      company: {
        id: companyId,
        name: company.name,
      },
    });
  } catch (error) {
    console.log("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

async function sendResetEmail(to, resetUrl) {
  const smtpHost = process.env.SMTP_HOST;

  if (!smtpHost) {
    // Development fallback: no SMTP configured, log the reset link so the
    // forgot-password flow can be exercised locally.
    console.log("[RESET] Email delivery not configured. Reset link:", resetUrl);
    return { delivered: false, devUrl: resetUrl };
  }

  let nodemailer;
  try {
    ({ default: nodemailer } = await import("nodemailer"));
  } catch {
    console.log("[RESET] nodemailer unavailable. Reset link:", resetUrl);
    return { delivered: false, devUrl: resetUrl };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  const from =
    process.env.SMTP_FROM || "NoShow OS <noreply@localhost>";

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your NoShow OS password",
    text: `You requested a password reset for your NoShow OS account.\n\nOpen the link below within 1 hour to choose a new password:\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n`,
    html: `<p>You requested a password reset for your NoShow OS account.</p><p>Open the link below within 1 hour to choose a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });

  return { delivered: true };
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const company = await Company.findOne({ email: cleanEmail });

    if (company) {
      // Random single-use token, stored as a bcrypt hash so a database
      // compromise does not expose a usable reset link.
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = await bcrypt.hash(token, 10);

      company.resetPasswordToken = hashedToken;
      company.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await company.save();

      const frontendUrl = (
        process.env.FRONTEND_URL || "http://localhost:3000"
      ).replace(/\/+$/, "");

      const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await sendResetEmail(company.email, resetUrl);
      } catch (error) {
        console.error("[RESET] Failed to send reset email:", error.message);
      }
    }

    // Generic response: do not reveal whether the email exists (anti-enumeration).
    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { upiId, language } = req.body;

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    if (typeof upiId === "string") {
      company.upiId = upiId.trim();
    }

    if (language !== undefined) {
      if (typeof language !== "string" || !["en", "hi", "mr"].includes(language)) {
        return res.status(400).json({
          success: false,
          message: "Language must be en, hi or mr",
        });
      }

      company.language = language;
    }

    if (typeof upiId === "string" || language !== undefined) {
      await company.save();
    }

    return res.status(200).json({
      message: "Settings updated",
      upiId: company.upiId || "",
      language: company.language || "en",
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getSettings = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      upiId: company.upiId || "",
      language: company.language || "en",
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Find every company with an unexpired reset token. The stored token is a
    // bcrypt hash, so we compare against the raw token with bcrypt.
    const eligible = await Company.find({
      resetPasswordToken: { $ne: null },
      resetPasswordExpires: { $gt: new Date() },
    });

    let company = null;
    for (const candidate of eligible) {
      if (await bcrypt.compare(token, candidate.resetPasswordToken)) {
        company = candidate;
        break;
      }
    }

    if (!company) {
      return res.status(400).json({
        message: "Reset link is invalid or has expired",
      });
    }

    company.Password = await bcrypt.hash(password, 12);
    // Single-use: invalidate the token immediately after a successful reset.
    company.resetPasswordToken = undefined;
    company.resetPasswordExpires = undefined;
    await company.save();

    return res.status(200).json({
      message: "Password reset successful. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

