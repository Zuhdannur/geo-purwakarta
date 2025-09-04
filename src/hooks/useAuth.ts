import { useState, useEffect } from 'react';

interface User {
  username: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true
  });

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setAuthState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading session:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Save to localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
          isLoading: false
        });
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      // Call logout API (optional)
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false
      });
    }
  };

  return {
    ...authState,
    login,
    logout
  };
}
