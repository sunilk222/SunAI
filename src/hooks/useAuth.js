import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "voiceapp_user";

function loadUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useAuth() {
  const [user, setUser] = useState(() => loadUser());

  useEffect(() => {
    if (user) {
      saveUser(user);
    }
  }, [user]);

  const login = useCallback((name, email) => {
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      loginAt: new Date().toISOString(),
      sessionId: crypto.randomUUID?.() || Date.now().toString(36),
    };
    setUser(userData);
    saveUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return { user, login, logout, isLoggedIn: !!user };
}
