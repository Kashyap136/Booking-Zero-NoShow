import express from "express";
import {
  updateCompanyLocation,
} from "../controllers/companyLocation.js";

import {
    register,
    login,
    forgotPassword,
    resetPassword,
    updateSettings,
    getSettings
} from "../controllers/authController.js";

import {
    RegistrationMiddleware,
    LoginMiddleware,
    authMiddleware
} from "../middleware/authMiddleware.js";


const router = express.Router();
router.post(
    "/register",
    RegistrationMiddleware,
    register
);


router.post(
  "/login",
  LoginMiddleware,
  login
);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPassword
);

router.put(
  "/location",
  authMiddleware,
  updateCompanyLocation
);

router.put(
  "/settings",
  authMiddleware,
  updateSettings
);

router.get(
  "/settings",
  authMiddleware,
  getSettings
);

export default router;

