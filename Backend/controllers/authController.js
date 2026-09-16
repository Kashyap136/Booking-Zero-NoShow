import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Company from "../models/companyModel.js";

export const register = async (req, res) => {
  try {
    const { name, subdomain, ownerEmail, password, upiId } = req.body;

   const normalizedEmail = ownerEmail.trim().toLowerCase();

    const normalizedSubdomain = subdomain.trim().toLowerCase();

    const existingCompany = await Company.findOne({
      $or: [
        {
          ownerEmail: normalizedEmail,
        },
        {
          subdomain: normalizedSubdomain,
        },
      ],
    });

    if (existingCompany) {
      return res.status(409).json({
        message: "Company or email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);


    const company = await Company.create({
      name: name.trim(),

      subdomain: normalizedSubdomain,

      ownerEmail: normalizedEmail,

      passwordHash,

      upiId: upiId ? upiId.trim() : null,
    });

    return res.status(201).json({
      message: "Company registered successfully",

      company: {
        id: company._id,

        name: company.name,

        subdomain: company.subdomain,

        ownerEmail: company.ownerEmail,

        upiId: company.upiId,
      },
    });
  } catch (error) {
    console.log("Register error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};



export const login = async (req, res) => {
  try {
    const { ownerEmail, password } = req.body;

    const normalizedEmail = ownerEmail.trim().toLowerCase();

    const company = await Company.findOne({
      ownerEmail: normalizedEmail,
    });

    if (!company) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      company.passwordHash,
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        companyId: company._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",

        algorithm: "HS256",
      },
    );


    return res.status(200).json({
      message: "Login successful",

      token,

      company: {
        id: company._id,

        name: company.name,

        subdomain: company.subdomain,

        ownerEmail: company.ownerEmail,
      },
    });
  } catch (error) {
    console.log("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


