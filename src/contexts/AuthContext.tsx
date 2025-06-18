import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mock users
const MOCK_USERS = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin' as const },
  { id: '2', name: 'Regular User', email: 'user@example.com', password: 'user123', role: 'user' as const },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.email === email && u.password === password);
        if (user) {
          // Remove password before saving to state
          const { password, ...userWithoutPassword } = user;
          setCurrentUser(userWithoutPassword);
          localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          resolve();
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500);
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    currentUser,
    login,
    logout,
    isAdmin: currentUser?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}