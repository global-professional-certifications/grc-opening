import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StoredUser, getStoredUser, setStoredUser, logout as authLogout } from '../lib/auth';

interface UserContextValue {
  user: StoredUser | null;
  setUser: (user: StoredUser) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<StoredUser | null>(null);

  useEffect(() => {
    setUserState(getStoredUser());
  }, []);

  const setUser = useCallback((u: StoredUser) => {
    setStoredUser(u);
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUserState(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
