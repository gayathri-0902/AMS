import React from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Components 
import LoginPage from "./components/LoginPage";
import FacultyDashboard from "./components/FacultyDashboard";
import StudentDashboard from "./components/StudentDashboard";
//import AdminDashboard from "./components/AdminDashboard";
import AdminDash2 from "./components/AdminDash2";
import ParentDashboard from "./components/ParentDashboard";
import SubjectDetails from "./components/SubjectDetails";
import AssignmentHub from "./components/AssignmentHub";
import HandIn from "./components/HandIn";
import AssignmentGrader from "./components/AssignmentGrader";


/**
 * HELPER: Determines the correct URL for a user based on their role and stored IDs.
 */
const getDashboardPath = (auth) => {
  if (!auth || !auth.isAuthenticated) return "/login";

  switch (auth.role) {
    case "admin":
      return "/admin-dashboard";
    case "faculty":
      return `/faculty-dashboard/${auth.facultyId || auth.userId}`;
    case "student":
      return `/student-dashboard/${auth.studentId || auth.userId}`;
    case "parent":
      return `/parent-dashboard/${auth.parentId || auth.userId}`;
    default:
      return "/login";
  }
};

/**
 * PROTECTED ROUTE COMPONENT
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { auth } = useAuth();

  // If not logged in, go to login
  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but trying to access a role they don't have
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={getDashboardPath(auth)} replace />;
  }

  return children;
};

/**
 * PUBLIC ROUTE COMPONENT
 */
const PublicRoute = ({ children }) => {
  const { auth } = useAuth();

  // If already logged in, don't show login page, go to dashboard
  if (auth?.isAuthenticated) {
    return <Navigate to={getDashboardPath(auth)} replace />;
  }

  return children;
};

/**
 * WRAPPER: Handles logic for when a Parent views a Student's Dashboard
 */
const StudentViewWrapper = () => {
  const { auth } = useAuth();
  const { studentId } = useParams();

  // If a parent is logged in, we let them view the dashboard of the ID in the URL
  // The StudentDashboard component uses auth.studentId by default, 
  // so we ensure it uses the URL param if available.
  return <StudentDashboard overrideId={studentId} />;
};

function App() {
  const { auth } = useAuth();

  // Safety check for Context initialization
  if (auth === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-antiqua">
        <div className="text-xl font-bold text-blue-600 animate-pulse">
          Initializing System...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-antiqua">
      <Routes>
        <Route
          path="/"
          element={<Navigate to={getDashboardPath(auth)} replace />}
        />

        {/* Public Route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Admin Access */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDash2 />
            </ProtectedRoute>
          }
        />


        {/* Faculty Access */}
        <Route
          path="/faculty-dashboard/:facultyId"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assignment-hub"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <AssignmentHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assignment-grader/:assignmentId"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <AssignmentGrader />
            </ProtectedRoute>
          }
        />

        {/* Student & Parent Access: Shared view for student details */}
        <Route
          path="/student-dashboard/:studentId"
          element={
            <ProtectedRoute allowedRoles={["student", "parent"]}>
              <StudentViewWrapper />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/subject-details/:id"
          element={
            <ProtectedRoute allowedRoles={["student", "parent"]}>
              <SubjectDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hand-in/:assignmentId"
          element={
            <ProtectedRoute allowedRoles={["student", "parent"]}>
              <HandIn />
            </ProtectedRoute>
          }
        />

        {/* Parent Access */}
        <Route
          path="/parent-dashboard/:parentId"
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={getDashboardPath(auth)} replace />} />
      </Routes>
    </div>
  );
}

export default App;