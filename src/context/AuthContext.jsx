import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const redirectToDashboard = (role, id) => {
  switch (role) {
    case "faculty":
      return `/faculty-dashboard/${id}`;
    case "student":
      return `/student-dashboard/${id}`;
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
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedFacultyId = localStorage.getItem("facultyId");
    const storedStudentId = localStorage.getItem("studentId");

    if (storedRole) {
      setAuth({
        isAuthenticated: true,
        role: storedRole,
        facultyId: storedFacultyId,
        studentId: storedStudentId,
      });

      // Redirect to appropriate dashboard if user is already logged in
      if (window.location.pathname === "/login") {
        navigate(
          redirectToDashboard(storedRole, storedFacultyId || storedStudentId)
        );
      }
    }
  }, [navigate]);

  // Login handler
  const login = async (role, identifier, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/login`,
        {
          role,
          identifier,
          password,
        }
      );

      const { facultyId, studentId, sectionId } = response.data;

      setAuth({
        isAuthenticated: true,
        role,
        facultyId: facultyId || null,
        studentId: studentId || null,
        sectionId: sectionId || null,
      });

      // Save user data in local storage
      localStorage.setItem("role", role);
      localStorage.setItem("facultyId", facultyId || "");
      localStorage.setItem("studentId", studentId || "");
      localStorage.setItem("sectionId", sectionId || "");

      // Redirect to the correct dashboard based on the role and ID
      if (role === "faculty" && facultyId) {
        navigate(redirectToDashboard(role, facultyId || studentId));
      } else if (role === "student" && studentId) {
        navigate(redirectToDashboard(role, facultyId || studentId));
      } else if (role === "admin") {
        navigate(redirectToDashboard(role));
      }
    } catch (error) {
      console.error("Login error:", error.response?.data?.message || error);
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("facultyId");
    localStorage.removeItem("studentId");
    setAuth({
      isAuthenticated: false,
      role: null,
      facultyId: null,
      studentId: null,
    });

    navigate("/login");
  };

  // const ProtectedRoute = ({ allowedRoles, children }) => {
  //   if (!auth.isAuthenticated) {
  //     return <Navigate to="/login" replace />;
  //   }

  //   if (allowedRoles && !allowedRoles.includes(auth.role)) {
  //     return <Navigate to={redirectToDashboard(auth.role)} replace />;
  //   }

  //   return children;
  // };
  const ProtectedRoute = ({ allowedRoles, children }) => {
    if (!auth.isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
      return (
        <Navigate
          to={redirectToDashboard(auth.role, auth.facultyId || auth.studentId)}
          replace
        />
      );
    }

    return children;
  };

  const PublicRoute = ({ children }) => {
    if (auth.isAuthenticated) {
      return <Navigate to={redirectToDashboard(auth.role)} replace />;
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
