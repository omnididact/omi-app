import { apiClient } from './client.js';

export class Thought {
  static async create(data) {
    return await apiClient.post('/thoughts', data);
  }

  static async list(orderBy = '-created_date') {
    const order = orderBy.startsWith('-') ? 
      `${orderBy.substring(1)} DESC` : 
      `${orderBy} ASC`;
    return await apiClient.get(`/thoughts?orderBy=${encodeURIComponent(order)}`);
  }

  static async filter(filters, orderBy = '-created_date') {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    
    const order = orderBy.startsWith('-') ? 
      `${orderBy.substring(1)} DESC` : 
      `${orderBy} ASC`;
    params.append('orderBy', order);
    
    return await apiClient.get(`/thoughts?${params.toString()}`);
  }

  static async findById(id) {
    return await apiClient.get(`/thoughts/${id}`);
  }

  static async update(id, data) {
    return await apiClient.put(`/thoughts/${id}`, data);
  }

  static async delete(id) {
    return await apiClient.delete(`/thoughts/${id}`);
  }
}

export class Goal {
  static async create(data) {
    return await apiClient.post('/goals', data);
  }

  static async list(orderBy = '-created_date') {
    const order = orderBy.startsWith('-') ? 
      `${orderBy.substring(1)} DESC` : 
      `${orderBy} ASC`;
    return await apiClient.get(`/goals?orderBy=${encodeURIComponent(order)}`);
  }

  static async filter(filters, orderBy = '-created_date') {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    
    const order = orderBy.startsWith('-') ? 
      `${orderBy.substring(1)} DESC` : 
      `${orderBy} ASC`;
    params.append('orderBy', order);
    
    return await apiClient.get(`/goals?${params.toString()}`);
  }

  static async findById(id) {
    return await apiClient.get(`/goals/${id}`);
  }

  static async update(id, data) {
    return await apiClient.put(`/goals/${id}`, data);
  }

  static async delete(id) {
    return await apiClient.delete(`/goals/${id}`);
  }
}

export class User {
  static async me() {
    return await apiClient.get('/auth/me');
  }

  static async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password }, { skipAuth: true });
    apiClient.setToken(response.token);
    return response;
  }

  static async register(email, name, password) {
    const response = await apiClient.post('/auth/register', { email, name, password }, { skipAuth: true });
    apiClient.setToken(response.token);
    return response;
  }

  static async logout() {
    apiClient.setToken(null);
  }

  static async update(data) {
    return await apiClient.put('/auth/me', data);
  }

  // For compatibility with base44's redirect-based auth, we'll show a login modal instead
  static async loginWithRedirect(redirectUrl) {
    // This would typically trigger a login modal/form in the UI
    // For now, we'll throw an error to indicate manual login is needed
    throw new Error('Manual login required - please use the login form');
  }
}