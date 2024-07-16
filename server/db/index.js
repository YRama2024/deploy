import mongoose from "mongoose";

// schema for company profile
const companyProfileSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  industry: { type: String, required: true },
  stage: { type: String, required: true },
  description: { type: String, required: true },
  logo: {type:String}
});

// schema for primary account
const primaryAccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  accountType: {
    type: String,
    enum: ["founder", "co-founder", "founding-team"],
    required: true,
  },
  // profilePic: {type:String}
});

// schema for secondary account
const secondaryAccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Enforce non-null email
  email: { type: String, required: true, validate: { validator: (email) => email !== null } },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

// define schema for company model
const companySchema = new mongoose.Schema({
  companyProfile: { type: companyProfileSchema, required: true },
  primaryAccount: { type: [primaryAccountSchema], required: true }, // arr of founding emp's acc's 
  secondaryAccount: { type: [secondaryAccountSchema] }, // arr of emp's acc's 
});

// create mongoose model for company
const Company = mongoose.model("Company", companySchema);

export default Company;
