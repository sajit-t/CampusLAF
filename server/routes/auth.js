import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campus_return_jwt_secret_key_2026';

// 1. Log In Endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const profile = await db.profiles.findByEmail(email.trim().toLowerCase());
    if (!profile) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, profile.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let studentDetails = null;
    if (profile.role === 'student' && profile.roll_number) {
      studentDetails = await db.students.findByRoll(profile.roll_number);
      if (studentDetails && !studentDetails.active_status) {
        return res.status(403).json({ error: 'Account disabled. Please contact the administrator.' });
      }
    }

    const tokenPayload = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      roll_number: profile.roll_number
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: studentDetails ? studentDetails.full_name : (profile.role === 'super_admin' ? 'Super Admin' : 'Security Admin'),
        student: studentDetails
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login processing' });
  }
});

// 2. Retrieve Self Endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await db.profiles.findById(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let studentDetails = null;
    if (profile.role === 'student' && profile.roll_number) {
      studentDetails = await db.students.findByRoll(profile.roll_number);
      if (studentDetails && !studentDetails.active_status) {
        return res.status(403).json({ error: 'Account disabled. Please contact the administrator.' });
      }
    }

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: studentDetails ? studentDetails.full_name : (profile.role === 'super_admin' ? 'Super Admin' : 'Security Admin'),
        student: studentDetails
      }
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Server error retrieving identity data' });
  }
});

export default router;
