import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Components 
import LoginPage from "./components/LoginPage";
import FacultyDashboard from "./components/FacultyDashboard";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ParentDashboard from "./components/ParentDashboard"; 
import SubjectDetails from "./components/SubjectDetails";

/**
 * HELPER: Determines the correct URL for a user based on their role and stored IDs.
 * This prevents the "blank screen" redirect loop.
 */
const getDashboardPath = (auth) => {
  if (!auth || !auth.isAuthenticated) return "/login";
  
  console.log("Routing logic checking Auth state:", auth);

  switch (auth.role) {
    case "admin":
      return "/admin-dashboard";
    case "faculty":
      // Prioritize facultyId, fallback to userId
      return `/faculty-dashboard/${auth.facultyId || auth.userId}`;
    case "student":
      // Prioritize studentId, fallback to userId
      return `/student-dashboard/${auth.studentId || auth.userId}`;
    case "parent":
      // Prioritize parentId, fallback to userId
      const pId = auth.parentId || auth.userId;
      return `/parent-dashboard/${pId}`;
    default:
      return "/login";
  }
};

/**
 * PROTECTED ROUTE COMPONENT
 * Guards routes from unauthenticated users or wrong roles.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { auth } = useAuth();

  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    // If user tries to access a page they don't own, send them to their specific dashboard
    return <Navigate to={getDashboardPath(auth)} replace />;
  }

  return children;
};

/**
 * PUBLIC ROUTE COMPONENT
 * Prevents logged-in users from seeing the Login page.
 */
const PublicRoute = ({ children }) => {
  const { auth } = useAuth();

  if (auth?.isAuthenticated) {
    return <Navigate to={getDashboardPath(auth)} replace />;
  }

  return children;
};

function App() {
  const authContext = useAuth();

  // Safety check for Context initialization
  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-bold text-blue-600 animate-pulse">
          Initializing System...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* 1. Login Page (Public Only) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* 2. Faculty Dashboard (Protected) */}
        <Route 
          path="/faculty-dashboard/:facultyId" 
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          } 
        />

        {/* 3. Student Dashboard & Sub-routes (Protected) */}
        <Route 
          path="/student-dashboard/:studentId" 
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/student/subject-details/:id" 
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <SubjectDetails />
            </ProtectedRoute>
          } 
        />

        {/* 4. Admin Dashboard (Protected) */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* 5. Parent Dashboard (Protected) */}
        <Route 
          path="/parent-dashboard/:parentId" 
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <ParentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* 6. Root Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 7. 404 Catch-All */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;