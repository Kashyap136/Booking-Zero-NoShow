import express from "express";

import {
  sendWhatsApp,
  sendWhatsAppTest,
} from "../controllers/whatsapp.js";

import {
  authMiddleware
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/test",
  authMiddleware,
  sendWhatsAppTest
);

router.post(
  "/send",
  authMiddleware,
  sendWhatsApp
);

export default router;