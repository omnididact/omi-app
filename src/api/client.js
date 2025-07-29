// API Configuration - Change this to your deployed backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Debug logging
console.log('🔧 API Configuration:');
console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  - API_BASE_URL:', API_BASE_URL);
console.log('  - Environment:', import.meta.env.MODE);

// For production, you can set VITE_API_URL in your environment
// Example: VITE_API_URL=https://your-backend.railway.app/api

class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.status = status;
    this.response = response;
  }
}

class APIClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    console.log('🔧 APIClient initialized with token:', this.token ? 'Present' : 'None');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    console.log('🔧 Token updated:', token ? 'Present' : 'Removed');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token && !options.skipAuth) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    console.log(`🌐 Making request to: ${url}`);
    console.log(`📋 Request config:`, {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? 'Present' : 'None'
    });

    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      // Handle 204 No Content responses (like DELETE operations)
      if (response.status === 204) {
        console.log('✅ 204 No Content - returning null');
        return null;
      }
      
      const data = await response.json();
      console.log(`📄 Response data:`, data);

      if (!response.ok) {
        console.error(`❌ Request failed: ${response.status} - ${data.error || 'Unknown error'}`);
        throw new APIError(data.error || 'Request failed', response.status, data);
      }

      console.log('✅ Request successful');
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error instanceof APIError) {
        throw error;
      }
      // Handle cases where response doesn't have JSON (like 204 responses)
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        throw new APIError('Invalid response format', 0, null);
      }
      throw new APIError('Network error', 0, null);
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

export const apiClient = new APIClient();
export { APIError };