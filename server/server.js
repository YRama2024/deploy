import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import fetchStartups from "./routes/fetchStartups.js";
import getCompanyData from './routes/getCompanyData.js'

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve static files from the 'uploads' directory

app.use("/auth", authRoutes);
app.use("/startups", fetchStartups);
app.use("/company/data", getCompanyData);

mongoose
  .connect("mongodb+srv://Upped:Upped@cluster0.77snokg.mongodb.net/")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Listening at port:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
