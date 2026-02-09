import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/**
 * HELPER: Determines the redirect URL
 */
const redirectToDashboard = (role, id) => {
  switch (role) {
    case "faculty":
      return `/faculty-dashboard/${id}`;
    case "student":
      return `/student-dashboard/${id}`;
    case "parent":
      return `/parent-dashboard/${id}`;
    case "admin":
      return "/admin-dashboard";
    default:
      return "/login";
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    role: null,
    userId: null,
    facultyId: null,
    studentId: null,
    parentId: null,
    sectionId: null,
    name: null,
  });
  const navigate = useNavigate();

  // --- RESTORE SESSION ON REFRESH ---
  useEffect(() => {
    const storedAuth = {
      role: localStorage.getItem("role"),
      userId: localStorage.getItem("userId"),
      facultyId: localStorage.getItem("facultyId"),
      studentId: localStorage.getItem("studentId"),
      parentId: localStorage.getItem("parentId"),
      sectionId: localStorage.getItem("sectionId"),
      name: localStorage.getItem("name"),
    };

    if (storedAuth.role) {
      setAuth({
        isAuthenticated: true,
        role: storedAuth.role,
        userId: storedAuth.userId,
        facultyId: storedAuth.facultyId || null,
        studentId: storedAuth.studentId || null,
        parentId: storedAuth.parentId || null,
        sectionId: storedAuth.sectionId || null,
        name: storedAuth.name || null,
      });

      // If they are on the login page but have a session, push them to their dashboard
      if (window.location.pathname === "/login" || window.location.pathname === "/") {
        const id = storedAuth.facultyId || storedAuth.studentId || storedAuth.parentId || storedAuth.userId;
        navigate(redirectToDashboard(storedAuth.role, id));
      }
    }
  }, [navigate]);

  // --- LOGIN HANDLER ---
  const login = async (role, identifier, password) => {
    try {
      // Note: Use your environment variable or fallback to localhost
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
      
      const response = await axios.post(`${baseUrl}/api/login`, {
        role,
        identifier,
        password,
      });

      const { userId, facultyId, studentId, parentId, sectionId, name, message } = response.data;

      // 1. Prepare global state
      const authState = {
        isAuthenticated: true,
        role: response.data.role, // Use role from server response for accuracy
        userId: userId,
        facultyId: facultyId || null,
        studentId: studentId || null,
        parentId: parentId || null,
        sectionId: sectionId || null,
        name: name || null,
      };

      setAuth(authState);

      // 2. Persist to Local Storage
      localStorage.setItem("role", authState.role);
      localStorage.setItem("userId", userId || "");
      localStorage.setItem("facultyId", facultyId || "");
      localStorage.setItem("studentId", studentId || "");
      localStorage.setItem("parentId", parentId || "");
      localStorage.setItem("sectionId", sectionId || "");
      localStorage.setItem("name", name || "");

      // 3. Navigate
      const targetId = facultyId || studentId || parentId || userId;
      navigate(redirectToDashboard(authState.role, targetId));
      
      return response.data;
    } catch (error) {
      console.error("Login error:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  // --- LOGOUT HANDLER ---
  const logout = () => {
    // Clear State
    setAuth({
      isAuthenticated: false,
      role: null,
      userId: null,
      facultyId: null,
      studentId: null,
      parentId: null,
      sectionId: null,
      name: null,
    });

    // Clear Storage
    localStorage.clear();

    // Send back to login
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};