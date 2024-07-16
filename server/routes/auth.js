import { authenticateJwt, SECRET } from "./../middleware/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import express from "express";
import Company from "../db/index.js";
import multer from "multer"

const secretKey = "uppedCommunity";

const router = express.Router();
// --------------------------------------------------------------------------------------------------- //
// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Directory to store uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);  // Unique filename
  }
});

const upload = multer({ storage: storage });

// Route to register a new company
router.post("/register/company", upload.single('logo'), async (req, res) => {
  try {
    const { companyName, industry, stage, description } = req.body;
    const logo = req.file ? req.file.path : '';

    // Check if company already exists
    const existingCompany = await Company.findOne({ "companyProfile.companyName": companyName });
    if (existingCompany) {
      return res.status(400).json({ message: "Company already exists" });
    }

    const companyProfile = {
      companyName,
      industry,
      stage,
      description,
      logo
    };

    const company = new Company({
      companyProfile
    });

    await company.save();
    res.status(201).json({ message: "Company registered successfully", company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//2. Route to register a founder
router.post(
  "/register/founder",
  // upload.single("profilePic"),
  async (req, res) => {
    try {
      // Extract founder details from request body
      const { companyId, name, email, password, accountType } = req.body;
      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }


      // Find the company by its ID
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Check if the founder already exists in the primaryAccount array
      const existingFounder = company.primaryAccount.find(
        (account) => account.email === email
      );
      if (existingFounder) {
        return res
          .status(400)
          .json({ error: `Founder '${name}' already exists for this company` });
      }

      // Validate the account type
      if (!["founder", "co-founder", "founding-team"].includes(accountType)) {
        return res.status(400).json({ error: "Invalid account type" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Add the founder to the company's primaryAccount array
      company.primaryAccount.push({
        name,
        email,
        password: hashedPassword, // Store the hashed password
        accountType,
        // profilePic: req.file.filename, // store filename from gridfs
      });

      // Save the updated company document
      await company.save();

      // generate jwt token
      const token = jwt.sign({ id: company._id }, SECRET, { expiresIn: "10h" });

      // Set appropriate founder role message
      let roleMessage = "";
      if (accountType === "co-founder") {
        roleMessage = "Co-founder";
      } else if (accountType === "founding-team") {
        roleMessage = "Founding team member";
      } else {
        roleMessage = "Founder";
      }

      res.status(201).json({
        message: `${roleMessage} registered successfully`,
        token: token,
      });
    } catch (error) {
      console.error("Error registering founder:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
// --------------------------------------------------------------------------------------------------- //
//3. Route to login founder
router.post("/login/founder", authenticateJwt, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the company by email
    const company = await Company.findOne({ "primaryAccount.email": email });

    // If company not found or no primary account with the provided email, return error
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Find the primary account with the provided email
    const primaryAccount = company.primaryAccount.find(
      (account) => account.email === email
    );

    // Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      primaryAccount.password
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Passwords match, generate JWT token
    const token = jwt.sign({ userId: primaryAccount._id }, SECRET);

    // Return success message with token
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// --------------------------------------------------------------------------------------------------- //

//4. Route to register other significant employees
router.post("/register/employee", async (req, res) => {
  try {
    // Extract employee details from request body
    const { companyId, name, email, password, role } = req.body;

    // Find the company by its ID
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Check if the employee already exists in the secondaryAccount array
    const existingEmployee = company.secondaryAccount.find(
      (account) => account.email === email
    );
    if (existingEmployee) {
      return res
        .status(400)
        .json({ error: `Employee '${name}' already exists for this company` });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add the employee to the company's secondaryAccount array
    company.secondaryAccount.push({
      name,
      email,
      password: hashedPassword, // Store the hashed password
      role,
    });

    // Save the updated company document
    await company.save();

    // generate jwt token
    const token = jwt.sign({ id: company._id }, SECRET, { expiresIn: "10h" });

    res.status(201).json({
      message: `Employee '${name}' registered successfully`,
      token: token,
    });
  } catch (error) {
    console.error("Error registering employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------------------------------//
//5. Route to login orther significant employess
router.post("/login/employee", authenticateJwt, async (req, res) => {
  try {
    // extract email and password from request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // find the company by email
    const company = await Company.findOne({ "secondaryAccount.email": email });

    // if company by email
    if (!company) {
      return res.status(404).json({ error: "company not found" });
    }

    // find the secondary account wiht the provided email
    const secondaryAccount = company.secondaryAccount.find(
      (account) => account.email === email
    );

    // verify password
    const passwordMatch = await bcrypt.compare(
      password,
      secondaryAccount.password
    );
    if (!passwordMatch) {
      return res.status(401).json({ error: "invalid password" });
    }

    // password match, generate JWT token
    const token = jwt.sign({ userId: secondaryAccount._id }, SECRET);
    // return sucess message
    res.status(200).json({ message: "Login sucessfull", token: token });
  } catch (error) {}
});

// ---------------------------------------------------------------------------------------------------//
// 6. Route to get all startups
router.post('/all', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'investor' && password === 'password') {
    try {
      const companies = await Company.find();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching companies', error });
    }
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});
export default router;
