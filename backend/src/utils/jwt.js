import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';

export const generateToken = (payload, options = {}) => {
  const config = getConfig();
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
    ...options
  });
};

export const verifyToken = (token) => {
  const config = getConfig();
  return jwt.verify(token, config.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE
  });
};

export const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

export const generateAccessToken = (user) => {
  return generateToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email
  });
};

import crypto from 'crypto';

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};