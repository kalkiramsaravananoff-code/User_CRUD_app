// API Service for calling the backend
// Get base URL from environment variable (set in .env)
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/user';

console.log('API Base URL:', API_URL);

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Create a new user
export const createUser = async (userData) => {
  return apiCall('/create', 'POST', userData);
};

// Get all users
export const getUsers = async () => {
  return apiCall('/getall', 'GET');
};

// Get a single user by ID
export const getUser = async (id) => {
  return apiCall(`/get/${id}`, 'GET');
};

// Update a user
export const updateUser = async (id, userData) => {
  return apiCall(`/update/${id}`, 'PUT', userData);
};

// Delete a user
export const deleteUser = async (id) => {
  return apiCall(`/delete/${id}`, 'DELETE');
};
