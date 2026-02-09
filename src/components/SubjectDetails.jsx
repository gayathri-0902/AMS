import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineArrowLeft, 
  HiOutlineBookOpen, 
  HiOutlineDocumentText, 
  HiOutlineClipboardList,
  HiOutlineCalendar
} from "react-icons/hi";

const SubjectDetails = () => {
  const { id } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!auth?.studentId) return;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/student/course-details/${auth.studentId}/${id}`
        );
        setData(response.data);
      } catch (err) {
        console.error("Error fetching course details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, auth?.studentId]);

  if (loading) return <div className="p-20 text-center text-blue-600 font-bold">Loading records...</div>;
  if (!data) return <div className="p-20 text-center">Data not found.</div>;

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8 font-antiqua">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 mb-8 font-bold hover:underline">
          <HiOutlineArrowLeft className="mr-2" /> BACK TO DASHBOARD
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm mb-10 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-800">{data.course_name}</h1>
          <p className="text-blue-600 font-bold mt-1 uppercase tracking-wider">{data.course_code}</p>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100">
              <p className="text-xs text-blue-600 font-bold uppercase">Overall Attendance</p>
              <h2 className="text-2xl font-bold text-blue-800">{data.attendanceStats?.percentage}%</h2>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center text-gray-700">
              <HiOutlineBookOpen className="mr-2 text-blue-500" /> Faculty Notes
            </h3>
            {data.notes?.length > 0 ? data.notes.map(note => (
              <div key={note._id} className="bg-white p-5 rounded-2xl shadow-sm border border-transparent hover:border-blue-200 transition-all">
                <h4 className="font-bold">{note.title}</h4>
                <a href={note.file_url} target="_blank" className="text-blue-600 text-sm font-bold flex items-center mt-2">
                  <HiOutlineDocumentText className="mr-1" /> DOWNLOAD
                </a>
              </div>
            )) : <div className="bg-white/50 p-6 rounded-2xl border-2 border-dashed text-center text-gray-400 italic">No notes uploaded.</div>}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center text-gray-700">
              <HiOutlineClipboardList className="mr-2 text-orange-500" /> Assignments
            </h3>
            {data.assignments?.length > 0 ? data.assignments.map(asm => (
              <div key={asm._id} className="bg-white p-5 rounded-2xl shadow-sm border border-transparent hover:border-orange-200 transition-all">
                <h4 className="font-bold">{asm.title}</h4>
                <p className="text-red-500 text-xs font-bold mt-1">Due: {new Date(asm.due_date).toLocaleDateString()}</p>
              </div>
            )) : <div className="bg-white/50 p-6 rounded-2xl border-2 border-dashed text-center text-gray-400 italic">No pending assignments.</div>}
          </div>
        </div>

        {/* --- ATTENDANCE TABLE SECTION --- */}
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-xl font-bold flex items-center text-gray-700">
              <HiOutlineCalendar className="mr-2 text-green-500" /> Attendance History
            </h3>
            <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Daily Log</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Session Type</th>
                  <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.attendanceRecords?.length > 0 ? data.attendanceRecords.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 text-gray-700 font-medium">
                      {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-5 text-gray-500 italic">{record.session_type || "Lecture"}</td>
                    <td className="p-5">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                        record.status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="p-10 text-center text-gray-400 italic">No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetails;