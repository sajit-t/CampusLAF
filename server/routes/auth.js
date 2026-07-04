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

// 3. Register / Create Account Endpoint
router.post('/register', async (req, res) => {
  const { role, email, password, rollNumber, adminCode } = req.body;

  if (!role || !password) {
    return res.status(400).json({ error: 'Role and password are required' });
  }

  try {
    if (role === 'student') {
      if (!rollNumber) {
        return res.status(400).json({ error: 'Roll number is required for students' });
      }
      
      const student = await db.students.findByRoll(rollNumber.trim());
      if (!student) {
        return res.status(404).json({ error: 'Student Roll Number not found in campus database. Please contact Admin.' });
      }

      // Check if profile already exists
      const existingProfile = await db.profiles.findByEmail(student.college_email.toLowerCase());
      if (existingProfile) {
        return res.status(409).json({ error: 'An account has already been registered for this student email.' });
      }

      // Create new profile mapped to student roll number
      const passwordHash = bcrypt.hashSync(password, 10);
      await db.profiles.create({
        email: student.college_email.toLowerCase(),
        password_hash: passwordHash,
        roll_number: rollNumber.trim(),
        role: 'student'
      });

      return res.status(201).json({ message: 'Account successfully registered! You can now log in.' });

    } else if (role === 'admin' || role === 'super_admin') {
      if (!email || !adminCode) {
        return res.status(400).json({ error: 'Email and Admin Registration Code are required' });
      }

      // Predefined admin register code
      if (adminCode !== 'Admin2026') {
        return res.status(403).json({ error: 'Invalid admin registration authorization code' });
      }

      const existingProfile = await db.profiles.findByEmail(email.trim().toLowerCase());
      if (existingProfile) {
        return res.status(409).json({ error: 'This email is already registered.' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      await db.profiles.create({
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        roll_number: null,
        role: role
      });

      return res.status(201).json({ message: 'Admin account created successfully! You can now log in.' });

    } else {
      return res.status(400).json({ error: 'Invalid user registration role.' });
    }
  } catch (error) {
    console.error('Registration API error:', error);
    res.status(500).json({ error: 'Server error occurred during account creation' });
  }
});

export default router;
