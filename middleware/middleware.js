const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');


const setupMiddleware = (app) => {
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user; 
    next();
  });
};

function authenticateResetToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.RESET_TOKEN_SECRET, async (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user; 
    next();
  });
};

module.exports = { setupMiddleware, authenticateToken,authenticateResetToken };
