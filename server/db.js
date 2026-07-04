import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const useSupabase = process.env.USE_SUPABASE === 'true' && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let sqliteDb = null;

if (useSupabase) {
  console.log('Database Mode: SUPABASE');
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
} else {
  console.log('Database Mode: LOCAL SQLITE');
}

// Helper to open SQLite database
async function getSqliteDb() {
  if (sqliteDb) return sqliteDb;
  sqliteDb = await open({
    filename: path.resolve('./campus_lost_found.sqlite'),
    driver: sqlite3.Database
  });

  // Ensure tables exist in SQLite
  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS students (
      roll_number TEXT PRIMARY KEY,
      register_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      section TEXT NOT NULL,
      college_email TEXT UNIQUE NOT NULL,
      phone_number TEXT NOT NULL,
      profile_photo TEXT,
      active_status BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      roll_number TEXT,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lost_items (
      id TEXT PRIMARY KEY,
      found_by_roll_number TEXT REFERENCES students(roll_number) ON DELETE SET NULL,
      category TEXT NOT NULL,
      item_name TEXT NOT NULL,
      brand TEXT,
      color TEXT,
      description TEXT NOT NULL,
      estimated_value DECIMAL(10,2) DEFAULT 0,
      found_location TEXT NOT NULL,
      building TEXT,
      floor INT,
      room TEXT,
      found_date TEXT NOT NULL,
      found_time TEXT,
      office_received_date TEXT,
      office_received_time TEXT,
      received_by_admin TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'Waiting for Owner',
      notes TEXT,
      images TEXT, -- stored as JSON string (array) in sqlite
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      item_id TEXT REFERENCES lost_items(id) ON DELETE CASCADE,
      claimant_roll_number TEXT REFERENCES students(roll_number) ON DELETE CASCADE,
      approval_status TEXT DEFAULT 'pending',
      approved_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      remarks TEXT,
      claim_request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expected_collection_deadline DATETIME NOT NULL,
      claimed_date DATETIME,
      verification_notes TEXT,
      receipt_code TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      performed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      affected_record_table TEXT NOT NULL,
      affected_record_id TEXT NOT NULL,
      details TEXT, -- stored as JSON string in sqlite
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return sqliteDb;
}

// Unified Database Adapter Export
export const db = {
  students: {
    async getAll({ search = '', department = '', year = '', limit = 10, offset = 0 } = {}) {
      if (useSupabase) {
        let query = supabase.from('students').select('*', { count: 'exact' });
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%,register_number.ilike.%${search}%`);
        }
        if (department) {
          query = query.eq('department', department);
        }
        if (year) {
          query = query.eq('year', year);
        }
        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (error) throw error;
        return { data, total: count };
      } else {
        const sqlite = await getSqliteDb();
        let whereClauses = [];
        let params = [];
        if (search) {
          whereClauses.push('(full_name LIKE ? OR roll_number LIKE ? OR register_number LIKE ?)');
          const s = `%${search}%`;
          params.push(s, s, s);
        }
        if (department) {
          whereClauses.push('department = ?');
          params.push(department);
        }
        if (year) {
          whereClauses.push('year = ?');
          params.push(year);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const data = await sqlite.all(`
          SELECT * FROM students 
          ${whereString} 
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const countRow = await sqlite.get(`
          SELECT COUNT(*) as count FROM students 
          ${whereString}
        `, params);

        return {
          data: data.map(s => ({ ...s, active_status: !!s.active_status })),
          total: countRow.count
        };
      }
    },

    async findByRoll(rollNumber) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('roll_number', rollNumber)
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const data = await sqlite.get('SELECT * FROM students WHERE roll_number = ?', [rollNumber]);
        return data ? { ...data, active_status: !!data.active_status } : null;
      }
    },

    async findByEmail(email) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('college_email', email)
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const data = await sqlite.get('SELECT * FROM students WHERE college_email = ?', [email]);
        return data ? { ...data, active_status: !!data.active_status } : null;
      }
    },

    async create(studentData) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('students')
          .insert([studentData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const fields = Object.keys(studentData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(studentData);
        await sqlite.run(`
          INSERT INTO students (${fields.join(', ')}) 
          VALUES (${placeholders})
        `, values);
        return studentData;
      }
    },

    async update(rollNumber, studentData) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('students')
          .update(studentData)
          .eq('roll_number', rollNumber)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const fields = Object.keys(studentData);
        const setString = fields.map(f => `${f} = ?`).join(', ');
        const values = Object.values(studentData);
        await sqlite.run(`
          UPDATE students 
          SET ${setString} 
          WHERE roll_number = ?
        `, [...values, rollNumber]);
        return { roll_number: rollNumber, ...studentData };
      }
    },

    async delete(rollNumber) {
      if (useSupabase) {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('roll_number', rollNumber);
        if (error) throw error;
        return true;
      } else {
        const sqlite = await getSqliteDb();
        await sqlite.run('DELETE FROM students WHERE roll_number = ?', [rollNumber]);
        return true;
      }
    },

    async setStatus(rollNumber, activeStatus) {
      const activeInt = activeStatus ? 1 : 0;
      if (useSupabase) {
        const { data, error } = await supabase
          .from('students')
          .update({ active_status: activeStatus })
          .eq('roll_number', rollNumber)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        await sqlite.run('UPDATE students SET active_status = ? WHERE roll_number = ?', [activeInt, rollNumber]);
        return { roll_number: rollNumber, active_status: activeStatus };
      }
    }
  },

  profiles: {
    async findByEmail(email) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        return await sqlite.get('SELECT * FROM profiles WHERE email = ?', [email]);
      }
    },

    async findById(id) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        return await sqlite.get('SELECT * FROM profiles WHERE id = ?', [id]);
      }
    },

    async findByRoll(rollNumber) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('roll_number', rollNumber)
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        return await sqlite.get('SELECT * FROM profiles WHERE roll_number = ?', [rollNumber]);
      }
    },

    async create(profileData) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const id = profileData.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullData = { id, ...profileData };
        const fields = Object.keys(fullData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(fullData);
        await sqlite.run(`
          INSERT INTO profiles (${fields.join(', ')}) 
          VALUES (${placeholders})
        `, values);
        return fullData;
      }
    }
  },

  items: {
    async getAll({ status = '', limit = 100, offset = 0 } = {}) {
      if (useSupabase) {
        let query = supabase.from('lost_items').select('*');
        if (status) {
          query = query.eq('status', status);
        }
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        let query = 'SELECT * FROM lost_items';
        let params = [];
        if (status) {
          query += ' WHERE status = ?';
          params.push(status);
        }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        const data = await sqlite.all(query, [...params, limit, offset]);
        return data.map(item => ({
          ...item,
          images: item.images ? JSON.parse(item.images) : []
        }));
      }
    },

    async findById(id) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('lost_items')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const data = await sqlite.get('SELECT * FROM lost_items WHERE id = ?', [id]);
        return data ? { ...data, images: data.images ? JSON.parse(data.images) : [] } : null;
      }
    },

    async create(itemData) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('lost_items')
          .insert([itemData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const dbPayload = {
          id,
          ...itemData,
          images: itemData.images ? JSON.stringify(itemData.images) : '[]'
        };
        const fields = Object.keys(dbPayload);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(dbPayload);
        await sqlite.run(`
          INSERT INTO lost_items (${fields.join(', ')}) 
          VALUES (${placeholders})
        `, values);
        return { ...itemData, id };
      }
    },

    async update(id, itemData) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('lost_items')
          .update(itemData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const dbPayload = { ...itemData };
        if (itemData.images) {
          dbPayload.images = JSON.stringify(itemData.images);
        }
        const fields = Object.keys(dbPayload);
        const setString = fields.map(f => `${f} = ?`).join(', ');
        const values = Object.values(dbPayload);
        await sqlite.run(`
          UPDATE lost_items 
          SET ${setString} 
          WHERE id = ?
        `, [...values, id]);
        return { id, ...itemData };
      }
    },

    async setStatus(id, status) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('lost_items')
          .update({ status })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        await sqlite.run('UPDATE lost_items SET status = ? WHERE id = ?', [status, id]);
        return { id, status };
      }
    },

    async delete(id) {
      if (useSupabase) {
        const { error } = await supabase
          .from('lost_items')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } else {
        const sqlite = await getSqliteDb();
        await sqlite.run('DELETE FROM lost_items WHERE id = ?', [id]);
        return true;
      }
    }
  },

  claims: {
    async getAll({ rollNumber = '', status = '' } = {}) {
      if (useSupabase) {
        let query = supabase.from('claims').select('*, lost_items(*)');
        if (rollNumber) {
          query = query.eq('claimant_roll_number', rollNumber);
        }
        if (status) {
          query = query.eq('approval_status', status);
        }
        const { data, error } = await query.order('claim_request_date', { ascending: false });
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        let query = `
          SELECT c.*, 
                 l.item_name, l.category, l.brand, l.color, l.description, l.found_location, l.images, l.status as item_status
          FROM claims c
          JOIN lost_items l ON c.item_id = l.id
        `;
        let whereClauses = [];
        let params = [];
        if (rollNumber) {
          whereClauses.push('c.claimant_roll_number = ?');
          params.push(rollNumber);
        }
        if (status) {
          whereClauses.push('c.approval_status = ?');
          params.push(status);
        }

        if (whereClauses.length > 0) {
          query += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        query += ' ORDER BY c.claim_request_date DESC';
        const data = await sqlite.all(query, params);

        return data.map(c => ({
          id: c.id,
          item_id: c.item_id,
          claimant_roll_number: c.claimant_roll_number,
          approval_status: c.approval_status,
          approved_by: c.approved_by,
          remarks: c.remarks,
          claim_request_date: c.claim_request_date,
          expected_collection_deadline: c.expected_collection_deadline,
          claimed_date: c.claimed_date,
          verification_notes: c.verification_notes,
          receipt_code: c.receipt_code,
          lost_items: {
            id: c.item_id,
            item_name: c.item_name,
            category: c.category,
            brand: c.brand,
            color: c.color,
            description: c.description,
            found_location: c.found_location,
            images: c.images ? JSON.parse(c.images) : [],
            status: c.item_status
          }
        }));
      }
    },

    async findById(id) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('claims')
          .select('*, lost_items(*)')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const c = await sqlite.get('SELECT * FROM claims WHERE id = ?', [id]);
        if (!c) return null;
        const item = await sqlite.get('SELECT * FROM lost_items WHERE id = ?', [c.item_id]);
        return {
          ...c,
          lost_items: item ? { ...item, images: item.images ? JSON.parse(item.images) : [] } : null
        };
      }
    },

    async create(claimData) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('claims')
          .insert([claimData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const id = `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const dbPayload = { id, ...claimData };
        const fields = Object.keys(dbPayload);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(dbPayload);
        await sqlite.run(`
          INSERT INTO claims (${fields.join(', ')}) 
          VALUES (${placeholders})
        `, values);
        return dbPayload;
      }
    },

    async update(id, claimData) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('claims')
          .update(claimData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const fields = Object.keys(claimData);
        const setString = fields.map(f => `${f} = ?`).join(', ');
        const values = Object.values(claimData);
        await sqlite.run(`
          UPDATE claims 
          SET ${setString} 
          WHERE id = ?
        `, [...values, id]);
        return { id, ...claimData };
      }
    }
  },

  logs: {
    async getAll() {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, profiles(email)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const data = await sqlite.all(`
          SELECT a.*, p.email as performed_by_email
          FROM audit_logs a
          LEFT JOIN profiles p ON a.performed_by = p.id
          ORDER BY a.created_at DESC
        `);
        return data.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null,
          profiles: log.performed_by_email ? { email: log.performed_by_email } : null
        }));
      }
    },

    async create(logData) {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('audit_logs')
          .insert([logData])
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const sqlite = await getSqliteDb();
        const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const dbPayload = {
          id,
          ...logData,
          details: logData.details ? JSON.stringify(logData.details) : null
        };
        const fields = Object.keys(dbPayload);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(dbPayload);
        await sqlite.run(`
          INSERT INTO audit_logs (${fields.join(', ')}) 
          VALUES (${placeholders})
        `, values);
        return dbPayload;
      }
    }
  }
};
