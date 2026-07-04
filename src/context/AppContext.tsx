import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Student {
  roll_number: string;
  register_number: string;
  full_name: string;
  department: string;
  year: string;
  section: string;
  college_email: string;
  phone_number: string;
  profile_photo: string;
  active_status: boolean;
  created_at?: string;
}

export interface Item {
  id: string;
  found_by_roll_number?: string;
  category: string;
  item_name: string;
  brand?: string;
  color?: string;
  description: string;
  estimated_value: number;
  found_location: string;
  building?: string;
  floor?: number;
  room?: string;
  found_date: string;
  found_time?: string;
  office_received_date?: string;
  office_received_time?: string;
  received_by_admin?: string;
  status: 'Waiting for Owner' | 'Claim Requested' | 'Claimed & Collected' | 'Archived';
  notes?: string;
  images: string[];
  created_at?: string;
  matchScore?: number | null; // Added from intelligent search
}

export interface Claim {
  id: string;
  item_id: string;
  claimant_roll_number: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'expired';
  approved_by?: string;
  remarks: string;
  claim_request_date: string;
  expected_collection_deadline: string;
  claimed_date?: string;
  verification_notes?: string;
  receipt_code?: string;
  lost_items?: Item; // Joined item details
}

export interface AuditLog {
  id: string;
  performed_by: string;
  action: string;
  affected_record_table: string;
  affected_record_id: string;
  details?: any;
  created_at: string;
  profiles?: { email: string };
}

export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin' | 'super_admin';
  name: string;
  roll_number?: string;
  student?: Student;
}

interface AppContextType {
  // Global States
  token: string | null;
  currentUser: User | null;
  activeStudent: Student | null; // Student details if currentUser is student
  items: Item[];
  claims: Claim[];
  auditLogs: AuditLog[];
  analytics: any | null;
  currentPage: string;
  selectedItemId: string | null;
  isLoading: boolean;
  errorMsg: string | null;

  // Setters/Navigators
  setPage: (page: string) => void;
  setSelectedItemId: (id: string | null) => void;
  clearError: () => void;

  // API Call actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: any) => Promise<boolean>;
  logout: () => void;
  fetchItems: (searchQuery?: string) => Promise<void>;
  fetchClaims: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  
  // Student Actions
  registerStudent: (studentData: Omit<Student, 'active_status'>) => Promise<boolean>;
  editStudent: (roll: string, studentData: Partial<Student>) => Promise<boolean>;
  toggleStudentStatus: (roll: string, active: boolean) => Promise<boolean>;
  deleteStudent: (roll: string) => Promise<boolean>;
  importStudents: (csvText: string) => Promise<string>;
  fetchStudentByRoll: (roll: string) => Promise<Student | null>;

  // Item Actions
  registerItem: (itemData: Omit<Item, 'id' | 'status' | 'images'>, files: File[]) => Promise<boolean>;
  editItem: (id: string, updateFields: Partial<Item>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;

  // Claim Actions
  submitClaim: (itemId: string, rollNumber: string, answers: string) => Promise<boolean>;
  approveClaim: (claimId: string, notes: string) => Promise<boolean>;
  rejectClaim: (claimId: string, remarks: string) => Promise<boolean>;
  cancelClaim: (claimId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cr_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);

  const [currentPage, setPage] = useState<string>('landing');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper fetch request
  const apiRequest = async (url: string, method = 'GET', body: any = null, isMultipart = false) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers
    };

    if (body) {
      config.body = isMultipart ? body : JSON.stringify(body);
    }

    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API Request failed');
    }
    return data;
  };

  // Load self profile if token exists on mount
  useEffect(() => {
    if (token) {
      setIsLoading(true);
      apiRequest('/api/auth/me')
        .then(data => {
          setCurrentUser(data.user);
          if (data.user.role === 'student' && data.user.student) {
            setActiveStudent(data.user.student);
          }
        })
        .catch(err => {
          console.error('Failed to verify token:', err);
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setCurrentUser(null);
      setActiveStudent(null);
    }
  }, [token]);

  // Load contextual listings once logged in
  useEffect(() => {
    if (currentUser) {
      fetchItems();
      fetchClaims();
      if (['admin', 'super_admin'].includes(currentUser.role)) {
        fetchAnalytics();
      }
      if (currentUser.role === 'super_admin') {
        fetchAuditLogs();
      }
    } else {
      setItems([]);
      setClaims([]);
      setAuditLogs([]);
      setAnalytics(null);
    }
  }, [currentUser]);

  const clearError = () => setErrorMsg(null);

  // 1. Authentication Actions
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiRequest('/api/auth/login', 'POST', { email, password });
      localStorage.setItem('cr_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      if (data.user.role === 'student' && data.user.student) {
        setActiveStudent(data.user.student);
      }
      setPage('dashboard');
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await apiRequest('/api/auth/register', 'POST', payload);
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cr_token');
    setToken(null);
    setCurrentUser(null);
    setActiveStudent(null);
    setPage('landing');
  };

  // 2. Fetch Lists
  const fetchItems = async (searchQuery = ''): Promise<void> => {
    setErrorMsg(null);
    try {
      const url = searchQuery ? `/api/items/search?q=${encodeURIComponent(searchQuery)}` : '/api/items/search';
      const data = await apiRequest(url);
      setItems(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const fetchClaims = async (): Promise<void> => {
    setErrorMsg(null);
    try {
      const data = await apiRequest('/api/claims');
      setClaims(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const fetchAuditLogs = async (): Promise<void> => {
    setErrorMsg(null);
    try {
      const data = await apiRequest('/api/audit-logs');
      setAuditLogs(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const fetchAnalytics = async (): Promise<void> => {
    setErrorMsg(null);
    try {
      const data = await apiRequest('/api/analytics');
      setAnalytics(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // 3. Student Administration CRUD
  const registerStudent = async (studentData: Omit<Student, 'active_status'>): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest('/api/students', 'POST', studentData);
      if (['admin', 'super_admin'].includes(currentUser?.role || '')) {
        fetchAnalytics();
      }
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const editStudent = async (roll: string, studentData: Partial<Student>): Promise<boolean> => {
    setErrorMsg(null);
    try {
      const updated = await apiRequest(`/api/students/${roll}`, 'PUT', studentData);
      // If student updated self, refresh active student state
      if (currentUser?.role === 'student' && currentUser.roll_number === roll) {
        setActiveStudent(updated);
      }
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const toggleStudentStatus = async (roll: string, active: boolean): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest(`/api/students/${roll}/status`, 'PUT', { active_status: active });
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const deleteStudent = async (roll: string): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest(`/api/students/${roll}`, 'DELETE');
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const importStudents = async (csvText: string): Promise<string> => {
    setErrorMsg(null);
    try {
      const res = await apiRequest('/api/students/import', 'POST', { csvText });
      if (['admin', 'super_admin'].includes(currentUser?.role || '')) {
        fetchAnalytics();
      }
      return res.message;
    } catch (err: any) {
      setErrorMsg(err.message);
      throw err;
    }
  };

  const fetchStudentByRoll = async (roll: string): Promise<Student | null> => {
    try {
      return await apiRequest(`/api/students/${roll}`);
    } catch (err) {
      return null;
    }
  };

  // 4. Lost Items Actions
  const registerItem = async (itemData: Omit<Item, 'id' | 'status' | 'images'>, files: File[]): Promise<boolean> => {
    setErrorMsg(null);
    try {
      let imageUrls: string[] = [];
      // 1. Upload files if present
      if (files && files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const uploadRes = await apiRequest('/api/items/upload', 'POST', formData, true);
        imageUrls = uploadRes.urls;
      }

      // 2. Submit lost item payload
      const payload = {
        ...itemData,
        images: imageUrls.length > 0 ? imageUrls : ['/uploads/placeholder.jpg']
      };
      await apiRequest('/api/items', 'POST', payload);
      
      // Refresh items and stats
      fetchItems();
      fetchAnalytics();
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const editItem = async (id: string, updateFields: Partial<Item>): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest(`/api/items/${id}`, 'PUT', updateFields);
      fetchItems();
      fetchAnalytics();
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest(`/api/items/${id}`, 'DELETE');
      fetchItems();
      fetchAnalytics();
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  // 5. Claims Processing
  const submitClaim = async (itemId: string, rollNumber: string, answers: string): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest('/api/claims', 'POST', {
        item_id: itemId,
        roll_number: rollNumber,
        remarks: answers
      });
      fetchItems();
      fetchClaims();
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const approveClaim = async (claimId: string, notes: string): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest(`/api/claims/${claimId}/approve`, 'PUT', { verification_notes: notes });
      fetchItems();
      fetchClaims();
      fetchAnalytics();
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const rejectClaim = async (claimId: string, remarks: string): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest(`/api/claims/${claimId}/reject`, 'PUT', { remarks });
      fetchItems();
      fetchClaims();
      fetchAnalytics();
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const cancelClaim = async (claimId: string): Promise<boolean> => {
    setErrorMsg(null);
    try {
      await apiRequest(`/api/claims/${claimId}/cancel`, 'PUT');
      fetchItems();
      fetchClaims();
      fetchAnalytics();
      return true;
    } catch (err: any) {
      setErrorMsg(err.message);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      token,
      currentUser,
      activeStudent,
      items,
      claims,
      auditLogs,
      analytics,
      currentPage,
      selectedItemId,
      isLoading,
      errorMsg,
      setPage,
      setSelectedItemId,
      clearError,
      login,
      register,
      logout,
      fetchItems,
      fetchClaims,
      fetchAuditLogs,
      fetchAnalytics,
      registerStudent,
      editStudent,
      toggleStudentStatus,
      deleteStudent,
      importStudents,
      fetchStudentByRoll,
      registerItem,
      editItem,
      deleteItem,
      submitClaim,
      approveClaim,
      rejectClaim,
      cancelClaim
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
