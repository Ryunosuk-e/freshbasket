const jwt = require('jsonwebtoken');

// Payload is deliberately small (just enough to identify the user and check
// their role) since it travels on every request.
const generateToken = ({ userId, role }) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h', // matches NFR02
  });
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { generateToken, verifyToken };
