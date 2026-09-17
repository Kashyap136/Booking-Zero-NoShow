import express from "express";

import {
  sendWhatsApp,
} from "../controllers/whatsapp.js";

const router = express.Router();

router.post(
  "/send",
  sendWhatsApp
);

export default router;