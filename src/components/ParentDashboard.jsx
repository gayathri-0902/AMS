import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineLogout, HiOutlineUserCircle, HiOutlineChartBar, HiOutlineAcademicCap } from "react-icons/hi";
import { MdOutlineFingerprint } from "react-icons/md";

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

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#f0f2f5] font-antiqua">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
       <p className="text-xl text-gray-600">Loading Dashboard...</p>
    </div>
  );
  
  if (error) return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#f0f2f5] font-antiqua p-6 text-center">
      <div className="bg-white p-10 rounded-[32px] shadow-lg max-w-md">
        <p className="text-xl font-bold text-red-600 mb-6">{error}</p>
        <button 
          onClick={handleLogout} 
          className="w-full bg-[#3b82f6] text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition shadow-md"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 md:p-8 font-antiqua">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="flex items-center gap-5 mb-4 md:mb-0">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <HiOutlineUserCircle size={40} />
            </div>
            <div>
              <h1 className="text-[32px] text-gray-800 leading-tight">Parent Dashboard</h1>
              <p className="text-[#64748b] text-lg">
                Child: <span className="text-[#3b82f6] font-bold">{data.studentDetails.student_name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm group"
          >
            <span className="text-lg">Logout</span>
            <HiOutlineLogout size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border-b-8 border-blue-500 flex flex-col items-center text-center">
            <MdOutlineFingerprint size={32} className="text-blue-500 mb-3" />
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Roll Number</h3>
            <p className="text-2xl text-gray-800">{data.studentDetails.student_id_no}</p>
          </div>
          
          <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30_rgb(0,0,0,0.03)] border-b-8 border-green-500 flex flex-col items-center text-center">
            <HiOutlineAcademicCap size={32} className="text-green-500 mb-3" />
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Branch / Stream</h3>
            <p className="text-2xl text-gray-800">{data.studentDetails.branch_name}</p>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border-b-8 border-purple-500 flex flex-col items-center text-center">
            <HiOutlineChartBar size={32} className="text-purple-500 mb-3" />
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Overall Attendance</h3>
            <p className={`text-3xl font-bold ${data.attendanceStats.percentage < 75 ? 'text-red-500' : 'text-green-600'}`}>
              {data.attendanceStats.percentage}%
            </p>
          </div>
        </div>

        {/* Recent Attendance Table */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-white">
          <div className="p-8 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-2xl text-gray-800">Recent Class Activity</h2>
            <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider">Latest updates from the classroom</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-400 uppercase text-xs font-bold tracking-widest">
                  <th className="p-6 border-b">Subject</th>
                  <th className="p-6 border-b">Date</th>
                  <th className="p-6 border-b">Session</th>
                  <th className="p-6 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentAttendance.length > 0 ? (
                  data.recentAttendance.map((record, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-6 font-medium text-gray-700 text-lg">{record.class_name}</td>
                      <td className="p-6 text-[#64748b]">{record.date}</td>
                      <td className="p-6 text-[#64748b] font-bold">Session {record.session_no}</td>
                      <td className="p-6 text-center">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold inline-block min-w-[100px] shadow-sm ${
                          record.status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-400 text-xl italic">
                      No attendance records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-12 mb-8 text-center text-[16px] text-[#94a3b8] italic">
          © 2026 Campus Management System
        </footer>
      </div>
    </div>
  );
};

export default ParentDashboard;