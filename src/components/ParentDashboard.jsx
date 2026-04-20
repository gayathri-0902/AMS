import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineLogout, 
  HiOutlineUser, 
  HiOutlineChartBar,
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck
} from "react-icons/hi";
import { useNavigate, useParams } from "react-router-dom";

const ParentDashboard = () => {
  const { auth, logout } = useAuth();
  const { id: urlId } = useParams(); // Capture ID from URL if present
  const navigate = useNavigate();
  const [children, setChildren] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);
        
        // Priority: 1. ID from URL, 2. Parent Profile ID from Auth, 3. User ID from Auth
        const targetId = urlId || auth?.parentId || auth?.userId;

        if (!targetId) {
          setError("No valid parent session found. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE}/api/parent/dashboard/${targetId}`);
        
        // Ensure we set an empty array if no data comes back to avoid .map() crashes
        setChildren(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        // Handle specific status codes for clearer user feedback
        if (err.response?.status === 500) {
          setError("Server error: Unable to calculate student records.");
        } else if (err.response?.status === 404) {
          setError("Parent profile not found in the system.");
        } else {
          setError("Unable to connect to the server. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, [urlId, auth?.parentId, auth?.userId, API_BASE]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-antiqua bg-[#f0f2f5] dark:bg-slate-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-sm">Synchronizing Portal...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 flex items-center justify-center p-4 font-antiqua">
      <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-2xl flex flex-col items-center max-w-md w-full text-center border border-gray-100 dark:border-slate-600">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
          <HiOutlineExclamationCircle size={48} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 tracking-tight">System Notice</h3>
        <p className="text-gray-500 dark:text-slate-400 dark:text-slate-500 mb-8 leading-relaxed">{error}</p>
        <div className="space-y-3 w-full">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            Try Again
          </button>
          <button 
            onClick={logout} 
            className="w-full bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-600 text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-700 transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 p-4 md:p-8 font-antiqua relative">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center space-x-4 p-2 text-left">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <HiOutlineUser className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white leading-none tracking-tight">
                {auth?.name || "Parent User"}
              </h2>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1 tracking-widest uppercase flex items-center">
                <HiOutlineShieldCheck className="mr-1" /> Authorized Parent Portal
              </p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="bg-white dark:bg-slate-800 border-2 border-red-500 text-red-500 px-6 py-2.5 rounded-2xl font-bold flex items-center space-x-2 hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-95"
          >
            <span>LOGOUT</span> <HiOutlineLogout size={20} />
          </button>
        </div>

        {/* --- TITLES --- */}
        <div className="mb-10 text-left px-2">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-xl text-gray-500 dark:text-slate-400 dark:text-slate-500 mt-1">
            Monitoring <span className="text-blue-600 dark:text-blue-400 font-bold">Academic Performance</span>
          </p>
        </div>

        {/* --- STUDENT GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {children.length > 0 ? (
            children.map((child, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border border-gray-100 dark:border-slate-600 text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-8">
                  <div className="bg-blue-50 dark:bg-blue-900/40 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <HiOutlineChartBar className="w-8 h-8" />
                  </div>
                  <span className="bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Student Linked
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 leading-tight">
                  {child.studentDetails?.student_name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                  {child.studentDetails?.student_id_no} • {child.studentDetails?.branch_name}
                </p>

                <div className="space-y-4 pt-6 border-t border-gray-50 dark:border-slate-700">
                   <div className="flex justify-between items-center">
                      <span className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-tighter">Overall Attendance</span>
                      <span className="text-gray-900 dark:text-white font-black text-xl">{child.attendanceStats?.percentage}%</span>
                   </div>
                   <div className="w-full bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-1000 ease-out" 
                        style={{ width: `${child.attendanceStats?.percentage || 0}%` }}
                      ></div>
                   </div>
                </div>

                <button 
                  onClick={() => navigate(`/student-dashboard/${child.studentDetails?.student_id}`)}
                  className="w-full mt-10 bg-[#1e293b] text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  VIEW FULL REPORT <HiOutlineArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-slate-800 rounded-[40px] p-20 text-center border-2 border-dashed border-gray-200 dark:border-slate-600">
               <div className="bg-gray-50 dark:bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <HiOutlineUser size={40} />
               </div>
               <p className="text-gray-500 dark:text-slate-400 dark:text-slate-500 text-xl font-medium italic">No students are currently linked to this profile.</p>
               <p className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                 Please contact the campus administration to map student roll numbers to your parent account.
               </p>
            </div>
          )}
        </div>

        <div className="text-center pb-10">
          <p className="text-gray-300 text-xs font-bold tracking-[0.2em] uppercase">
            © 2026 CMS Academic Management System
          </p>
        </div>

      </div>
    </div>
  );
};

export default ParentDashboard;