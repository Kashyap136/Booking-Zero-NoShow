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


export const   RegistrationMiddleware = (req, res, next) => {
    const {
        name,
        subdomain,
        ownerEmail,
        password
    } = req.body;

    if (!name || !subdomain || !ownerEmail || !password) {
        return res.status(400).json({
            message: "All required fields are required"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters"
        });
    }

    next();
};

export const LoginMiddleware = (req, res, next) => {
    const {
        ownerEmail,
        password
    } = req.body;

    if (!ownerEmail || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    next();
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