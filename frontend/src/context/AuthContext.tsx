import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

// Define types
type User = {
  _id: string;
  name: string;
  email: string;
  role: 'consumer' | 'farmer' | 'vendor' | 'admin';
  phone?: string;
  address?: string;
  businessName?: string;
  businessDescription?: string;
  averageRating?: number;
  totalReviews?: number;
  createdAt?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (userData: any) => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  clearError: () => void;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Clear error
  const clearError = () => setError(null);

  // Register a new user
  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      console.error('Registration error:', err);
      throw err; // Re-throw the error so the component can catch it
    } finally {
      setLoading(false);
    }
  };

  // Login a user
  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      throw err; // Re-throw the error so the component can catch it
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.updateProfile(profileData);
      setUser(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      console.error('Profile update error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout the current user
  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load user on initial render if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.getItem('token')) {
        setLoading(true);
        try {
          const response = await authApi.getCurrentUser();
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('token');
          console.error('Error loading user:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        register,
        login,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};