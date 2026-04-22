import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(
      JSON.parse(localStorage.getItem("user"))
    );
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

    function login(newToken, newUser) {
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    }

    function logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}