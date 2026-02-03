import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// --- REDIRECT LOGIC UPDATED FOR PARENT ---
const redirectToDashboard = (role, id) => {
  switch (role) {
    case "faculty":
      return `/faculty-dashboard/${id}`;
    case "student":
      return `/student-dashboard/${id}`;
    case "parent":
      return `/parent-dashboard/${id}`; // Added Parent Route
    case "admin":
      return "/admin-dashboard";
    default:
      return "/";
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    role: null,
    facultyId: null,
    studentId: null,
    parentId: null, // Added Parent ID
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedFacultyId = localStorage.getItem("facultyId");
    const storedStudentId = localStorage.getItem("studentId");
    const storedParentId = localStorage.getItem("parentId"); // Added Parent storage check

    if (storedRole) {
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
          redirectToDashboard(storedRole, storedFacultyId || storedStudentId || storedParentId)
        );
      }
    }
  }, [navigate]);

  // --- LOGIN HANDLER UPDATED FOR NEW UI ROLES ---
  const login = async (role, identifier, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/login`,
        {
          role, // This will be 'admin', 'faculty', 'student', or 'parent' from the new UI
          identifier,
          password,
        }
      );

      // Extracting IDs from backend response
      const { facultyId, studentId, parentId, sectionId } = response.data;

      setAuth({
        isAuthenticated: true,
        role,
        facultyId: facultyId || null,
        studentId: studentId || null,
        parentId: parentId || null,
        sectionId: sectionId || null,
      });

      // Save user data in local storage
      localStorage.setItem("role", role);
      localStorage.setItem("facultyId", facultyId || "");
      localStorage.setItem("studentId", studentId || "");
      localStorage.setItem("parentId", parentId || "");
      localStorage.setItem("sectionId", sectionId || "");

      // Use the helper to determine which ID to pass for redirection
      const targetId = facultyId || studentId || parentId;

      if (role === "admin") {
        navigate(redirectToDashboard(role));
      } else if (targetId) {
        navigate(redirectToDashboard(role, targetId));
      }
      
    } catch (error) {
      console.error("Login error:", error.response?.data?.message || error);
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  // --- LOGOUT HANDLER (Cleaned up all IDs) ---
  const logout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("facultyId");
    localStorage.removeItem("studentId");
    localStorage.removeItem("parentId");
    localStorage.removeItem("sectionId");
    
    setAuth({
      isAuthenticated: false,
      role: null,
      facultyId: null,
      studentId: null,
      parentId: null,
    });

    navigate("/login");
  };

  const ProtectedRoute = ({ allowedRoles, children }) => {
    if (!auth.isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
      return (
        <Navigate
          to={redirectToDashboard(auth.role, auth.facultyId || auth.studentId || auth.parentId)}
          replace
        />
      );
    }

    return children;
  };

  const PublicRoute = ({ children }) => {
    if (auth.isAuthenticated) {
      return (
        <Navigate 
          to={redirectToDashboard(auth.role, auth.facultyId || auth.studentId || auth.parentId)} 
          replace 
        />
      );
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