import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (userData: { name: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
    const response = await api.put('/auth/update-profile', profileData);
    return response.data;
  },

  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    const response = await api.post('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProfileImage: async () => {
    const response = await api.delete('/profile/delete-image');
    return response.data;
  },

  getProfileImage: async () => {
    const response = await api.get('/profile/image');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Family Tree API calls
export const familyTreeAPI = {
  getAll: () => api.get('/family-trees').then(res => res.data),
  getById: (id: string) => api.get(`/family-trees/${id}`).then(res => res.data),
  getMembersForLinking: (id: string) => api.get(`/family-trees/${id}/members-for-linking`).then(res => res.data),
  create: (data: { name: string; description?: string; privacy?: string }) => 
    api.post('/family-trees', data).then(res => res.data),
  update: (id: string, data: any) => 
    api.put(`/family-trees/${id}`, data).then(res => res.data),
  delete: (id: string) => 
    api.delete(`/family-trees/${id}`).then(res => res.data),
  addMember: (treeId: string, memberData: any) =>
    api.post(`/family-trees/${treeId}/members`, memberData).then(res => res.data),
  updateMember: (treeId: string, memberId: string, memberData: any) =>
    api.put(`/family-trees/${treeId}/members/${memberId}`, memberData).then(res => res.data),
  deleteMember: (treeId: string, memberId: string) =>
    api.delete(`/family-trees/${treeId}/members/${memberId}`).then(res => res.data)
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getTreeAnalytics: async (treeId: string) => {
    const response = await api.get(`/dashboard/analytics/trees/${treeId}`);
    return response.data;
  },

  generateReport: async (reportType: string, filters?: any) => {
    const response = await api.post('/dashboard/reports/generate', { reportType, filters });
    return response.data;
  },
};

// User API calls
export const userAPI = {
  updateProfile: async (updates: any) => {
    const response = await api.put('/users/profile', updates);
    return response.data;
  },
};

// Tree Link API calls
export const treeLinkAPI = {
  searchTrees: async (query: string, excludeTreeId?: string): Promise<any[]> => {
    const params = new URLSearchParams({ query });
    if (excludeTreeId) params.append('excludeTreeId', excludeTreeId);
    const response = await api.get(`/tree-links/search?${params}`);
    return response.data;
  },
  
  sendRequest: async (data: {
    sourceTreeId: string;
    targetTreeId: string;
    requestMessage: string;
    relationshipMapping: any[];
    linkType?: string;
    linkPrivacy?: string;
  }): Promise<any> => {
    const response = await api.post('/tree-links/request', data);
    return response.data;
  },
  
  getPendingRequests: async (): Promise<any[]> => {
    const response = await api.get('/tree-links/pending');
    return response.data;
  },
  
  acceptRequest: async (linkId: string, responseMessage?: string): Promise<any> => {
    const response = await api.put(`/tree-links/${linkId}/accept`, { responseMessage });
    return response.data;
  },
  
  rejectRequest: async (linkId: string, responseMessage?: string): Promise<any> => {
    const response = await api.put(`/tree-links/${linkId}/reject`, { responseMessage });
    return response.data;
  },
  
  reportDispute: async (linkId: string, reason: string, description: string): Promise<any> => {
    const response = await api.put(`/tree-links/${linkId}/dispute`, { reason, description });
    return response.data;
  },
  
  getTreeLinks: async (treeId: string): Promise<any[]> => {
    const response = await api.get(`/tree-links/tree/${treeId}`);
    return response.data;
  },
  
  cancelRequest: async (linkId: string): Promise<void> => {
    await api.delete(`/tree-links/${linkId}`);
  }
};

export default api; 