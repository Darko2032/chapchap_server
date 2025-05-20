// Middleware d'authentification
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Secret pour signer les tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'chap-chap-secret-key-2025';

// Middleware pour vérifier l'authentification
const verifyToken = (req, res, next) => {
  // Récupérer le token du cookie ou de l'en-tête Authorization
  const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.redirect('/admin/login.html');
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/admin/login.html');
  }
};

// Fonction pour générer un token
const generateToken = (username) => {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
};

// Validation des identifiants
const validateCredentials = (username, password) => {
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'chapchap2025';
  
  return username === validUsername && password === validPassword;
};

module.exports = {
  verifyToken,
  generateToken,
  validateCredentials,
  JWT_SECRET
};
