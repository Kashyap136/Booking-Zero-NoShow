import jwt from "jsonwebtoken";

export const validAuthMiddleware = (req, res, next) => {
    const { ownerEmail, password } = req.body;

    if (!ownerEmail || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    next();
};


export const RegistrationMiddleware = (req, res, next) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  next();
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginMiddleware = (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Input type validation
    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid input type",
      });
    }

    // Clean email
    const cleanEmail = email.trim().toLowerCase();

    // Email validation
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Password length validation
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Put cleaned email back into request
    req.body.email = cleanEmail;

    next();
  } catch (error) {
    console.log("Login middleware error:", error);

    return res.status(400).json({
      message: "Invalid request",
    });
  }
};






export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization header missing"
            });
        }

        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        req.companyId = decoded.companyId;

        next();

    } catch (error) {

        console.log(error);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};