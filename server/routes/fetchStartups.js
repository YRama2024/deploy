import express from 'express';
import Company from './../db/index.js';

const router = express.Router();

router.post('/list', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'investor' && password === 'growth') {
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
