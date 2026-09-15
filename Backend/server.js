import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import routerStaff from "./routes/staff.js";
import routerAttendance from "./routes/attendance.js";
import "dotenv/config";

const app = express();
const port = 5000;

app.use(express.json());

async function mongodb() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("connected to Database");
    } catch (err) {
        console.log(err);
    }
}
mongodb();


app.use("/api/staff", routerStaff);
app.use("/api/attendance", routerAttendance);

app.listen(port, () => {
    console.log("server is listening on port", port);
});