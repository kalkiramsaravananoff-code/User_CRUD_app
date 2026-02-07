
const API_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api/user';

console.log('API Base URL:', API_URL);

// Types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface UserData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
}

interface User extends UserData {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function for API calls
const apiCall = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body: any = null
): Promise<T> => {
  const options: RequestInit = {
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
    const errorData = (await response.json().catch(() => ({}))) as Partial<ApiResponse<unknown>>;
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as ApiResponse<T>;
  if (data.data) {
    return data.data;
  }
  throw new Error('No data returned from server');
};

// Create a new user
export const createUser = async (userData: UserData): Promise<User> => {
  return apiCall<User>('/create', 'POST', userData);
};

// Get all users
export const getUsers = async (): Promise<User[]> => {
  return apiCall<User[]>('/getall', 'GET');
};

// Get a single user by ID
export const getUser = async (id: string): Promise<User> => {
  return apiCall<User>(`/get/${id}`, 'GET');
};

// Update a user
export const updateUser = async (id: string, userData: UserData): Promise<User> => {
  return apiCall<User>(`/update/${id}`, 'PUT', userData);
};

// Delete a user
export const deleteUser = async (id: string): Promise<{ deletedId: string }> => {
  return apiCall<{ deletedId: string }>(`/delete/${id}`, 'DELETE');
};
