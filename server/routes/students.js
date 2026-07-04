import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// 1. GET /api/students (Admin & Super Admin only)
router.get('/', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  const { search = '', department = '', year = '', page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  try {
    const { data, total } = await db.students.getAll({
      search,
      department,
      year,
      limit: limitNum,
      offset
    });
    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ error: 'Server error retrieving students database' });
  }
});

// 2. GET /api/students/export (Admin & Super Admin only)
router.get('/export', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { data } = await db.students.getAll({ limit: 10000, offset: 0 });
    let csv = 'Roll Number,Register Number,Full Name,Department,Year,Section,Email,Phone,Active Status\n';
    data.forEach(s => {
      csv += `"${s.roll_number}","${s.register_number}","${s.full_name.replace(/"/g, '""')}","${s.department}","${s.year}","${s.section}","${s.college_email}","${s.phone_number}","${s.active_status ? 'Active' : 'Disabled'}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Server error generating CSV export file' });
  }
});

// 3. GET /api/students/:roll_number (Authorized: Admins OR Student searching for auto-fill in claims / workflow)
router.get('/:roll_number', authenticateToken, async (req, res) => {
  const { roll_number } = req.params;

  try {
    const student = await db.students.findByRoll(roll_number);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }
    // Security: Student roles can only view details of themselves, or we let them retrieve for auto-fill of details if they scan a barcode / enter roll number.
    // Wait, the prompt says in Receive Lost Item and Claim workflows, roll number retrieves details.
    // So we allow any logged-in user to retrieve student info by Roll Number to enable the auto-fill.
    res.json(student);
  } catch (error) {
    console.error('Fetch student error:', error);
    res.status(500).json({ error: 'Server error querying student details' });
  }
});

// 4. POST /api/students (Admin & Super Admin only)
router.post('/', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  const { roll_number, register_number, full_name, department, year, section, college_email, phone_number, profile_photo } = req.body;

  if (!roll_number || !register_number || !full_name || !department || !year || !section || !college_email || !phone_number) {
    return res.status(400).json({ error: 'All primary student attributes are required' });
  }

  try {
    // Check duplicates
    const existing = await db.students.findByRoll(roll_number);
    if (existing) return res.status(409).json({ error: 'Roll number already exists in database' });

    const newStudent = await db.students.create({
      roll_number,
      register_number,
      full_name,
      department,
      year,
      section,
      college_email,
      phone_number,
      profile_photo: profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      active_status: true
    });

    // Create auth profile
    const defaultPasswordHash = bcrypt.hashSync('Password123', 10);
    await db.profiles.create({
      email: college_email.toLowerCase(),
      password_hash: defaultPasswordHash,
      roll_number,
      role: 'student'
    });

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'CREATE_STUDENT',
      affected_record_table: 'students',
      affected_record_id: roll_number,
      details: { roll_number, name: full_name }
    });

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Server error registering student record' });
  }
});

// 5. PUT /api/students/:roll_number (Admins OR own Student editing profile)
router.put('/:roll_number', authenticateToken, async (req, res) => {
  const { roll_number } = req.params;
  const isSelf = req.user.role === 'student' && req.user.roll_number === roll_number;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Cannot modify other student profiles' });
  }

  // Student can only update email, phone, profile photo
  const { full_name, department, year, section, college_email, phone_number, profile_photo, active_status } = req.body;

  try {
    const student = await db.students.findByRoll(roll_number);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const updatePayload = {};
    if (isAdmin) {
      if (full_name !== undefined) updatePayload.full_name = full_name;
      if (department !== undefined) updatePayload.department = department;
      if (year !== undefined) updatePayload.year = year;
      if (section !== undefined) updatePayload.section = section;
      if (active_status !== undefined) updatePayload.active_status = active_status;
    }
    if (college_email !== undefined) updatePayload.college_email = college_email;
    if (phone_number !== undefined) updatePayload.phone_number = phone_number;
    if (profile_photo !== undefined) updatePayload.profile_photo = profile_photo;

    const updated = await db.students.update(roll_number, updatePayload);

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'UPDATE_STUDENT',
      affected_record_table: 'students',
      affected_record_id: roll_number,
      details: updatePayload
    });

    res.json(updated);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Server error modifying student record' });
  }
});

// 6. PUT /api/students/:roll_number/status (Admin & Super Admin only)
router.put('/:roll_number/status', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  const { roll_number } = req.params;
  const { active_status } = req.body;

  if (active_status === undefined) {
    return res.status(400).json({ error: 'active_status parameter is required' });
  }

  try {
    const updated = await db.students.setStatus(roll_number, active_status);

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: active_status ? 'ENABLE_STUDENT' : 'DISABLE_STUDENT',
      affected_record_table: 'students',
      affected_record_id: roll_number,
      details: { roll_number, active_status }
    });

    res.json(updated);
  } catch (error) {
    console.error('Status toggle error:', error);
    res.status(500).json({ error: 'Server error altering student status' });
  }
});

// 7. DELETE /api/students/:roll_number (Admin & Super Admin only)
router.delete('/:roll_number', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  const { roll_number } = req.params;

  try {
    const student = await db.students.findByRoll(roll_number);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await db.students.delete(roll_number);

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'DELETE_STUDENT',
      affected_record_table: 'students',
      affected_record_id: roll_number,
      details: { roll_number, name: student.full_name }
    });

    res.json({ message: 'Student record deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Server error deleting student record' });
  }
});

// 8. POST /api/students/import (Admin & Super Admin only)
router.post('/import', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  const { csvText } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: 'CSV data string required' });
  }

  try {
    const lines = csvText.split('\n');
    let imported = 0;
    const defaultPasswordHash = bcrypt.hashSync('Password123', 10);

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts[0] === 'Roll Number' || parts[0] === 'roll_number') continue; // Header

      const [roll, reg, name, dept, yr, sec, email, phone] = parts;
      if (!roll || !reg || !name || !email) continue;

      const existing = await db.students.findByRoll(roll);
      if (existing) continue;

      await db.db.students.create({
        roll_number: roll,
        register_number: reg,
        full_name: name,
        department: dept || 'CS',
        year: yr || 'I Year',
        section: sec || 'A',
        college_email: email,
        phone_number: phone || '0000000000',
        profile_photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        active_status: true
      });

      await db.db.profiles.create({
        email: email.toLowerCase(),
        password_hash: defaultPasswordHash,
        roll_number: roll,
        role: 'student'
      });

      imported++;
    }

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'CSV_IMPORT_STUDENTS',
      affected_record_table: 'students',
      affected_record_id: 'multiple',
      details: { count: imported }
    });

    res.json({ message: `Successfully imported ${imported} student records.` });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Server error parsing CSV import data' });
  }
});

export default router;
