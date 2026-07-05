import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY) must be configured.');
}

console.log('Database Mode: SUPABASE ONLY');
const supabase = createClient(supabaseUrl, supabaseKey);

// Unified Database Adapter Export for Supabase
export const db = {
  students: {
    async getAll({ search = '', department = '', year = '', limit = 10, offset = 0 } = {}) {
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
    },

    async findByRoll(rollNumber) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('roll_number', rollNumber)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async findByEmail(email) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('college_email', email)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(studentData) {
      const { data, error } = await supabase
        .from('students')
        .insert([studentData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(rollNumber, studentData) {
      const { data, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('roll_number', rollNumber)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(rollNumber) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('roll_number', rollNumber);
      if (error) throw error;
      return true;
    },

    async setStatus(rollNumber, activeStatus) {
      const { data, error } = await supabase
        .from('students')
        .update({ active_status: activeStatus })
        .eq('roll_number', rollNumber)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  profiles: {
    async findByEmail(email) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async findByRoll(rollNumber) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('roll_number', rollNumber)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(profileData) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  items: {
    async getAll({ status = '', limit = 100, offset = 0 } = {}) {
      let query = supabase.from('lost_items').select('*');
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data;
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(itemData) {
      const { data, error } = await supabase
        .from('lost_items')
        .insert([itemData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, itemData) {
      const { data, error } = await supabase
        .from('lost_items')
        .update(itemData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async setStatus(id, status) {
      const { data, error } = await supabase
        .from('lost_items')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('lost_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  claims: {
    async getAll({ rollNumber = '', status = '' } = {}) {
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
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('claims')
        .select('*, lost_items(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(claimData) {
      const { data, error } = await supabase
        .from('claims')
        .insert([claimData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, claimData) {
      const { data, error } = await supabase
        .from('claims')
        .update(claimData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  logs: {
    async getAll() {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async create(logData) {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([logData])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
};
