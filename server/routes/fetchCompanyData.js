import express from "express";
import Company from "../db/index.js";

const router = express.Router();

router.get("/company/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (company) {
      res.status(200).json(company);
    } else {
      res.status(404).json({ message: "Company not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
