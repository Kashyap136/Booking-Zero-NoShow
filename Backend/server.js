import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

const app=express();
const port=27017;

async function mongodb() {
     try{
          await mongoose.connect(process.env.MONGO_URL)
          console.log("connected to Database")
     }catch(err){
       console.log(err);
     }
}

app.listen(port,()=>{
    console.log("port is listing");
})


