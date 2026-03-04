import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
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

  // --- FORCE RESET ON STARTUP ---
  // This ensures the app always starts at the Login page
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedFacultyId = localStorage.getItem("facultyId");
    const storedStudentId = localStorage.getItem("studentId");
    const storedParentId = localStorage.getItem("parentId"); // Added Parent storage check

    if (storedRole && !auth.isAuthenticated) {
      setAuth({
        isAuthenticated: true,
        role: storedRole,
        facultyId: storedFacultyId,
        studentId: storedStudentId,
        parentId: storedParentId,
      });

      // Redirect to appropriate dashboard if user is already logged in
      if (window.location.pathname === "/login") {
        navigate(
          redirectToDashboard(storedRole, storedFacultyId || storedStudentId)
        );
      }
    }
  }, [auth.isAuthenticated]);

  // --- FORCE CLEAR SESSION ON STARTUP ---
  // This clears any stale session so the app always starts fresh
  useEffect(() => {
    // 1. Clear State
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

    // 2. Clear Storage so no old session remains
    localStorage.clear();

    // 3. Force navigation to login
    if (window.location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, []); // Empty dependency array runs only once when app starts

  // --- LOGIN HANDLER ---
  const login = async (role, identifier, password) => {
    try {
      // Note: Using your environment variable VITE_API_BASE_URL (defaults to 3002 as per your .env)
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

      const response = await axios.post(`${baseUrl}/api/login`, {
        role,
        identifier,
        password,
      });

      const { userId, facultyId, studentId, parentId, sectionId, name } = response.data;

      // 1. Prepare global state
      const authState = {
        isAuthenticated: true,
        role: response.data.role,
        userId: userId,
        facultyId: facultyId || null,
        studentId: studentId || null,
        parentId: parentId || null,
        sectionId: sectionId || null,
        name: name || null,
      };

      setAuth(authState);

      // 2. Persist to Local Storage (Optional: only if you want session to survive minor refreshes AFTER login)
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
    navigate("/");
  };

  const ProtectedRoute = ({ allowedRoles, children }) => {
    if (!auth.isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
      const id =
        auth.role === "faculty"
          ? auth.facultyId
          : auth.role === "student"
          ? auth.studentId
          : null;
      return (
        <Navigate
          to={redirectToDashboard(auth.role, id)}
          replace
        />
      );
    }

    return children;
  };

  const PublicRoute = ({ children }) => {
    const location = useLocation();

    if (auth.isAuthenticated) {
      const id =
        auth.role === "faculty"
          ? auth.facultyId
          : auth.role === "student"
          ? auth.studentId
          : null;

      const target = redirectToDashboard(auth.role, id);

      if (location.pathname !== target) {
        return <Navigate to={target} replace />;
      }
    }
    return children;
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        ProtectedRoute,
        PublicRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};