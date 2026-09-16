import express from "express";
import {
  updateCompanyLocation,
} from "../controller/CompanyLocation.js"

import {
    register,
    login
} from "../controller/authController.js";

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

router.put(
  "/location",
  authMiddleware,
  updateCompanyLocation
);

export default router;

