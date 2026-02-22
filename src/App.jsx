import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import AdminTimetable from "./components/AdminTimetable";
import FacultyDashboard from "./components/FacultyDashboard";
import StudentDashboard from "./components/StudentDashboard";
import SubjectDetails from "./components/SubjectDetails"; 
import { useAuth } from "./context/AuthContext";
import FeedbackPage from "./components/FeedbackPage";

function App() {
  const { ProtectedRoute, PublicRoute } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timetable"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty-dashboard/:facultyId"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-dashboard/:studentId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        {/* Added the route below */}
        <Route
          path="/student/subject-details/:id"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <SubjectDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/feedback/:subjectOfferingId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;