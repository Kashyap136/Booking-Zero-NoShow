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

