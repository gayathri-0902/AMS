import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineArrowLeft, 
  HiOutlineBookOpen, 
  HiOutlineClipboardList, 
  HiOutlineDownload,
  HiOutlineCheckCircle
} from "react-icons/hi";

const SubjectDetails = () => {
  const { id } = useParams(); // subject_offering_id
  const { auth } = useAuth();
  const navigate = useNavigate();
  
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjectData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Notes and Assignments
        const [notesRes, assignmentsRes, attendanceRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/notes/${id}`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/assignments/${id}`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/attendance/${auth.studentId}`)
        ]);

        setNotes(notesRes.data);
        setAssignments(assignmentsRes.data);

        // 2. Filter the overall attendance for just this subject
        const currentSubjectStats = attendanceRes.data.subjectAttendance.find(
          (item) => item.subject_offering_id === id
        );
        setAttendanceStats(currentSubjectStats);

      } catch (error) {
        console.error("Error fetching subject details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && auth.studentId) {
      fetchSubjectData();
    }
  }, [id, auth.studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg font-medium text-blue-600 animate-pulse">Loading materials & attendance...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors font-semibold"
        >
          <HiOutlineArrowLeft className="mr-2" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">Course Materials & Status</h1>

        {/* --- ATTENDANCE SUMMARY SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 border-l-8 border-l-blue-500">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <HiOutlineCheckCircle className="text-blue-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">My Attendance</h2>
          </div>

          {attendanceStats ? (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-bold">Present</p>
                <p className="text-2xl font-black text-green-600">{attendanceStats.present_count}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-bold">Total Classes</p>
                <p className="text-2xl font-black text-gray-800">{attendanceStats.total_count}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 uppercase font-bold">Percentage</p>
                <p className="text-2xl font-black text-blue-700">{attendanceStats.percentage}%</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No attendance data recorded yet.</p>
          )}
        </div>

        {/* --- ASSIGNMENTS SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-orange-100 p-2 rounded-lg mr-3">
              <HiOutlineClipboardList className="text-orange-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Assignments</h2>
          </div>

          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((a) => (
                <div key={a._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-gray-800">{a.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">{a.instructions}</p>
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
                      Due: {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <a 
                    href={a.file_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <HiOutlineDownload className="mr-2" /> Download
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic text-center py-4">No assignments posted yet.</p>
            )}
          </div>
        </div>

        {/* --- STUDY RESOURCES SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <HiOutlineBookOpen className="text-purple-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Study Resources & Notes</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div key={note._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-800">{note.title}</p>
                    <p className="text-xs text-gray-500">{note.description || "Shared by Faculty"}</p>
                  </div>
                  <a 
                    href={note.file_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 font-bold text-sm hover:underline"
                  >
                    View Resource
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic text-center py-4">No study resources found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubjectDetails;