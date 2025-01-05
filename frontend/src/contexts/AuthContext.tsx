import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

// AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);

          const adminResponse = await fetch("http://localhost:3000/auth/admin-status", {
            credentials: "include",
          });
          
          if (adminResponse.ok) {
            const { isAdmin } = await adminResponse.json();
            setIsAdmin(isAdmin);
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch("http://localhost:3000/auth/logout", {
        method: "GET",
        credentials: "include",
      });
      setUser(null);
      setIsAdmin(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
