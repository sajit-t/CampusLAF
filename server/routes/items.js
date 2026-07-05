import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// File upload setup
const uploadDir = './server/uploads';
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Unable to create upload directory (could be read-only filesystem):', err.message);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Image Upload Endpoint (Admins only)
router.post('/upload', authenticateToken, authorizeRole(['admin', 'super_admin']), upload.array('files', 5), (req, res) => {
  try {
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

// Synonym mappings for intelligent matching
const synonyms = [
  ['earphones', 'earbuds', 'airpods', 'headphones', 'pods', 'audio'],
  ['phone', 'iphone', 'samsung', 'pixel', 'mobile', 'device', 'android'],
  ['wallet', 'purse', 'cardholder', 'billfold', 'pouch'],
  ['bottle', 'flask', 'hydration', 'canteen', 'tumbler'],
  ['keys', 'key', 'fob', 'keyring'],
  ['laptop', 'macbook', 'computer', 'notebook', 'pc'],
  ['watch', 'smartwatch', 'applewatch', 'timepiece'],
  ['charger', 'cable', 'adapter', 'powerbank', 'wire']
];

const stopwords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'near', 'with', 'for', 'of', 'and', 'or', 'is', 'it', 'to', 'by', 'from', 'my', 'i', 'have', 'lost', 'found']);

// 1. GET /api/items/search - Intelligent Natural Language Search
router.get('/search', authenticateToken, async (req, res) => {
  const { q = '' } = req.query;
  const cleanQuery = q.trim().toLowerCase();

  try {
    // Load active items (Waiting for Owner, Claim Requested, Claimed & Collected)
    // Archived items should NOT be returned to students, but admins can access them.
    const allItems = await db.items.getAll({ limit: 1000, offset: 0 });
    const isUserAdmin = ['admin', 'super_admin'].includes(req.user.role);

    // Filter visible items
    const visibleItems = allItems.filter(item => {
      if (isUserAdmin) return true; // Admins see everything
      return item.status !== 'Archived'; // Students don't see archived items
    });

    if (!cleanQuery) {
      // If no query, return visible items with 100% or null match score
      return res.json(visibleItems.map(item => ({ ...item, matchScore: null })));
    }

    // Tokenize search query
    const queryTokens = cleanQuery
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .split(/\s+/)
      .filter(t => t && !stopwords.has(t));

    const scoredResults = visibleItems.map(item => {
      let score = 0;
      let matchedFields = new Set();

      const itemNameLower = item.item_name.toLowerCase();
      const descLower = item.description.toLowerCase();
      const catLower = item.category.toLowerCase();
      const brandLower = (item.brand || '').toLowerCase();
      const colorLower = (item.color || '').toLowerCase();
      const locLower = item.found_location.toLowerCase();
      const bldgLower = (item.building || '').toLowerCase();

      // Check each token
      queryTokens.forEach(token => {
        let tokenMatched = false;

        // Exact/Partial checks
        if (itemNameLower.includes(token)) {
          score += 35;
          matchedFields.add('name');
          tokenMatched = true;
        }
        if (brandLower.includes(token)) {
          score += 25;
          matchedFields.add('brand');
          tokenMatched = true;
        }
        if (colorLower.includes(token)) {
          score += 25;
          matchedFields.add('color');
          tokenMatched = true;
        }
        if (catLower.includes(token)) {
          score += 20;
          matchedFields.add('category');
          tokenMatched = true;
        }
        if (locLower.includes(token) || bldgLower.includes(token)) {
          score += 25;
          matchedFields.add('location');
          tokenMatched = true;
        }
        if (descLower.includes(token)) {
          score += 15;
          matchedFields.add('description');
          tokenMatched = true;
        }

        // Synonym mapping fallback
        if (!tokenMatched) {
          const matchingSet = synonyms.find(set => set.includes(token));
          if (matchingSet) {
            // Check if item fields have any word in synonym set
            const hasSynonym = matchingSet.some(syn => 
              itemNameLower.includes(syn) || 
              descLower.includes(syn) || 
              catLower.includes(syn)
            );
            if (hasSynonym) {
              score += 20;
              matchedFields.add('synonym');
            }
          }
        }
      });

      // Calculate final percentage confidence score (cap at 99%)
      const matchScore = score > 0 ? Math.min(99, score) : 0;

      return {
        ...item,
        matchScore
      };
    });

    // Filter out zero matches if there was a query, and sort by score descending
    const filteredResults = scoredResults
      .filter(item => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(filteredResults);

  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ error: 'Server error during intelligent search' });
  }
});

// 2. GET /api/items - Retrieve Active Items List
router.get('/', authenticateToken, async (req, res) => {
  const { status = '' } = req.query;
  try {
    const items = await db.items.getAll({ status });
    const isUserAdmin = ['admin', 'super_admin'].includes(req.user.role);

    // Limit visibility to students
    const visible = items.filter(item => {
      if (isUserAdmin) return true;
      return item.status !== 'Archived';
    });

    res.json(visible);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Server error fetching lost items' });
  }
});

// 3. GET /api/items/:id - Retrieve Item Details
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const item = await db.items.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    // Students cannot view archived items
    if (item.status === 'Archived' && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Item is archived' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get item details error:', error);
    res.status(500).json({ error: 'Server error retrieving item details' });
  }
});

// 4. POST /api/items - Register New Lost Item (Admins only)
router.post('/', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  const {
    found_by_roll_number,
    category,
    item_name,
    brand,
    color,
    description,
    estimated_value,
    found_location,
    building,
    floor,
    room,
    found_date,
    found_time,
    notes,
    images
  } = req.body;

  if (!category || !item_name || !description || !found_location || !found_date) {
    return res.status(400).json({ error: 'Primary item details (name, category, description, location, date) are required' });
  }

  try {
    // If student roll number provided, verify it exists
    if (found_by_roll_number) {
      const student = await db.students.findByRoll(found_by_roll_number);
      if (!student) {
        return res.status(400).json({ error: 'Student Roll Number is invalid' });
      }
    }

    const newItem = await db.items.create({
      found_by_roll_number: found_by_roll_number || null,
      category,
      item_name,
      brand: brand || '',
      color: color || '',
      description,
      estimated_value: parseFloat(estimated_value) || 0,
      found_location,
      building: building || '',
      floor: parseInt(floor) || null,
      room: room || '',
      found_date,
      found_time: found_time || null,
      received_by_admin: req.user.id,
      status: 'Waiting for Owner',
      notes: notes || '',
      images: images || []
    });

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'REGISTER_LOST_ITEM',
      affected_record_table: 'lost_items',
      affected_record_id: newItem.id || 'new',
      details: { name: item_name, category }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Server error registering lost item' });
  }
});

// 5. PUT /api/items/:id - Update Item Details (Admins only)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const item = await db.items.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const updated = await db.items.update(id, updateFields);

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'UPDATE_ITEM',
      affected_record_table: 'lost_items',
      affected_record_id: id,
      details: updateFields
    });

    res.json(updated);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Server error modifying lost item details' });
  }
});

// 6. DELETE /api/items/:id - Delete Item (Admins only)
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'super_admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const item = await db.items.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await db.items.delete(id);

    // Log action
    await db.logs.create({
      performed_by: req.user.id,
      action: 'DELETE_ITEM',
      affected_record_table: 'lost_items',
      affected_record_id: id,
      details: { name: item.item_name }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Server error deleting item' });
  }
});

export default router;
