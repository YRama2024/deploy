import jwt from "jsonwebtoken"
const SECRET = 'UppedCommunity';  // This should be in an environment variable in a real application

const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.userId = user.id;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export {authenticateJwt,SECRET}

// for Investors
const fixedInvestorId = "Investor101";
const fixedPassword = "Growth";

const investorAuth = (req, res, next) => {
  const { investorid, password } = req.headers;

  if (investorid === fixedInvestorId && password === fixedPassword) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default investorAuth;
