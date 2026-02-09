import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ParentDashboard = () => {
  const { parentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/parent/dashboard/${parentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data. Please ensure your child is linked to your account.");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (parentId) {
      fetchParentData();
    }
  }, [parentId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading Dashboard...</div>;
  
  if (error) return (
    <div className="flex flex-col justify-center items-center h-screen text-red-600">
      <p className="text-xl font-bold">{error}</p>
      <button onClick={handleLogout} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Back to Login</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-md">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
            <p className="text-gray-600">Monitoring performance for: <strong>{data.studentDetails.student_name}</strong></p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase">Roll Number</h3>
            <p className="text-2xl font-bold">{data.studentDetails.student_id_no}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase">Branch / Stream</h3>
            <p className="text-2xl font-bold">{data.studentDetails.branch_name}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase">Overall Attendance</h3>
            <p className={`text-2xl font-bold ${data.attendanceStats.percentage < 75 ? 'text-red-500' : 'text-green-600'}`}>
              {data.attendanceStats.percentage}%
            </p>
          </div>
        </div>

        {/* Recent Attendance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Recent Class Activity</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-sm">
                <th className="p-4 border-b">Subject</th>
                <th className="p-4 border-b">Date</th>
                <th className="p-4 border-b">Session</th>
                <th className="p-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAttendance.length > 0 ? (
                data.recentAttendance.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-4 border-b font-medium">{record.class_name}</td>
                    <td className="p-4 border-b text-gray-600">{record.date}</td>
                    <td className="p-4 border-b text-gray-600">Session {record.session_no}</td>
                    <td className="p-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        record.status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No attendance records found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;