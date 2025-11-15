import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const AuthContext = createContext(null);

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Example: Load user from localStorage or API on mount
  useEffect(() => {
    // Simulate fetching user info or check auth token
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Example login function
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Example logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Add any token cleanup or redirect logic here
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming auth context
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
