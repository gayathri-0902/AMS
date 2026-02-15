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
  const { id: urlSubjectId } = useParams(); // ID from the URL
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        
        // Logic: Parents and Students both use the 'id' from the URL to fetch subject info
        // We also need the Student's ID. 
        // If a student is logged in, we use auth.studentId.
        // If a parent is logged in, we should ideally have the student's ID in the URL or state.
        // For this route, we will assume the URL provides the Subject Offering ID.
        
        const targetStudentId = auth.studentId || auth.userId; // Fallback for testing

        const response = await axios.get(
          `${API_BASE}/api/student/course-details/${targetStudentId}/${urlSubjectId}`
        );
        
        setCourseData(response.data);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Unable to load course materials.");
      } finally {
        setLoading(false);
      }
    };

    if (urlSubjectId) fetchCourseDetails();
  }, [urlSubjectId, auth.studentId, API_BASE]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-antiqua">Loading Course...</div>;

  if (error) return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 font-antiqua">
      <div className="bg-white p-8 rounded-[40px] shadow-xl text-center">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-bold">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8 font-antiqua">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-blue-600 font-bold mb-8 transition-colors"
        >
          <HiOutlineArrowLeft className="mr-2" /> BACK TO DASHBOARD
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 mb-8 text-left">
          <div className="flex items-center space-x-6">
            <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-lg">
              <HiOutlineBookOpen className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">{courseData?.course_name}</h1>
              <p className="text-blue-600 font-bold tracking-widest uppercase">{courseData?.course_code}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Attendance Summary */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 text-left">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <HiOutlineCalendar className="mr-2 text-blue-600" /> Attendance
              </h3>
              <div className="text-5xl font-black text-gray-900 mb-2">
                {courseData?.attendanceStats?.percentage}%
              </div>
              <p className="text-gray-400 text-sm font-bold uppercase mb-6">Current Standing</p>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full" 
                  style={{ width: `${courseData?.attendanceStats?.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right: Notes and Assignments */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Notes Section */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 text-left">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <HiOutlineDocumentText className="mr-2 text-blue-600" /> Class Notes
              </h3>
              <div className="space-y-4">
                {courseData?.notes?.length > 0 ? courseData.notes.map((note, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-800">{note.title}</p>
                      <p className="text-xs text-gray-400">{new Date(note.upload_date).toLocaleDateString()}</p>
                    </div>
                    <a href={note.file_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-sm">VIEW</a>
                  </div>
                )) : (
                  <p className="text-gray-400 italic">No notes uploaded yet.</p>
                )}
              </div>
            </div>

            {/* Assignments Section */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 text-left">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <HiOutlineClipboardList className="mr-2 text-blue-600" /> Assignments
              </h3>
              <div className="space-y-4">
                {courseData?.assignments?.length > 0 ? courseData.assignments.map((task, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-800">{task.title}</p>
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">DUE: {new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{task.instructions}</p>
                    {task.file_url && <a href={task.file_url} className="text-xs text-blue-600 font-bold underline">DOWNLOAD ATTACHMENT</a>}
                  </div>
                )) : (
                  <p className="text-gray-400 italic">No pending assignments.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SubjectDetails;