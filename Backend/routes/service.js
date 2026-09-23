import express from "express";

import {
    create,
    list,
    update,
    remove
} from "../controllers/servicesController.js";

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

router.post(
    "/update",
    authMiddleware,
    update
);

router.post(
    "/delete",
    authMiddleware,
    remove
);


export default router;