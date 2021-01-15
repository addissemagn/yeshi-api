const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("token");
  if (!token) {
    return res.status(401).json({
      message: "Auth error, missing token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Invalid token",
    });
  }
};

module.exports = auth;