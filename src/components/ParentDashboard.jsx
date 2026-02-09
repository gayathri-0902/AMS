import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineLogout, 
  HiOutlineUser, 
  HiOutlineBookOpen, 
  HiOutlineChartBar,
  HiOutlineArrowRight
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";

const ParentDashboard = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        // Replace this with your actual endpoint for fetching linked students
        const response = await axios.get(`${API_BASE}/api/parent/children/${auth.userId}`);
        setChildren(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Unable to connect to the server. Please check your connection.");
        setLoading(false);
      }
    };

    if (auth?.userId) fetchParentData();
  }, [auth?.userId, API_BASE]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-antiqua text-blue-600 font-bold">
      Loading Dashboard...
    </div>
  );

  // Error State matching your screenshot's "NetworkError" style but cleaner
  if (error) return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[40px] shadow-2xl flex flex-col items-center max-w-md w-full">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 text-4xl font-bold">!</div>
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">Connection Error</h3>
        <p className="text-gray-500 text-center mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8 font-antiqua relative">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER: Individual Elements --- */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center space-x-4 p-2">
            <div className="h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg">
              <HiOutlineUser className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-800 leading-none tracking-tight">
                {auth?.name || "Parent Account"}
              </h2>
              <p className="text-sm font-bold text-teal-600 uppercase mt-1 tracking-widest">
                Parent Portal • 2026
              </p>
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center space-x-2 bg-white border-2 border-red-500 text-red-500 px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-95"
          >
            <span>LOGOUT</span>
            <HiOutlineLogout size={20} />
          </button>
        </div>

        {/* --- TITLES --- */}
        <div className="mb-10 text-left px-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">Parent Dashboard</h1>
          <p className="text-xl text-gray-500 mt-1">
            Monitoring student <span className="text-teal-600 font-bold">Academic Progress</span>
          </p>
        </div>

        {/* --- LINKED STUDENTS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {children.length > 0 ? (
            children.map((child, index) => (
              <div 
                key={index} 
                className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-300 text-left"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="bg-teal-50 w-14 h-14 rounded-2xl flex items-center justify-center text-teal-600">
                    <HiOutlineChartBar className="w-8 h-8" />
                  </div>
                  <span className="bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Linked Student
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 leading-tight mb-1">
                  {child.student_name}
                </h3>
                <p className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-6">
                  {child.student_id_no} • {child.branch_name}
                </p>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                   <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Overall Attendance</span>
                      <span className="text-gray-800 font-bold">{child.attendance_percentage || "0.00"}%</span>
                   </div>
                   <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full transition-all duration-1000" 
                        style={{ width: `${child.attendance_percentage || 0}%` }}
                      ></div>
                   </div>
                </div>

                <button 
                  onClick={() => navigate(`/parent/student-details/${child.student_id}`)}
                  className="w-full mt-10 bg-[#1e293b] text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-teal-600 transition-all shadow-lg"
                >
                  VIEW FULL REPORT <HiOutlineArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-200">
               <p className="text-gray-400 text-xl italic">No students linked to this account yet.</p>
            </div>
          )}
        </div>

        <footer className="mt-10 mb-8 text-center text-gray-400 text-sm italic">
          © 2026 Campus Management System • Parent Access
        </footer>
      </div>
    </div>
  );
};

export default ParentDashboard;