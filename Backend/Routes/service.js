import express from "express";

import {
    create,
    list
} from "../controller/servicesController.js";

import {
    authMiddleware
} from "../middleware/authMiddleware.js";


const router = express.Router();
router.post(
    "/create",
    authMiddleware,
    create
);


router.get(
    "/list",
    authMiddleware,
    list
);


export default router;

