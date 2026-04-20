import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineArrowLeft, 
  HiOutlineBookOpen, 
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineChevronRight
} from "react-icons/hi";

const SubjectDetails = () => {
  const { id: urlSubjectId } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const targetStudentId = auth.studentId || auth.userId;
        const [courseRes, asmRes] = await Promise.all([
          axios.get(`${API_BASE}/api/student/course-details/${targetStudentId}/${urlSubjectId}`),
          axios.get(`${API_BASE}/api/assignment/subject/${urlSubjectId}`),
        ]);
        setCourseData(courseRes.data);
        setAssignments(asmRes.data || []);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Unable to load course materials.");
      } finally {
        setLoading(false);
      }
    };
    if (urlSubjectId) fetchAll();
  }, [urlSubjectId, auth.studentId, API_BASE]);

  const getDaysLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Overdue", color: "bg-red-100 text-red-600" };
    if (days === 0) return { label: "Due Today!", color: "bg-orange-100 text-orange-600" };
    return { label: `${days}d left`, color: days <= 3 ? "bg-orange-100 text-orange-600" : "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" };
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-antiqua">Loading Course...</div>;

  if (error) return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 flex items-center justify-center p-4 font-antiqua">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-xl text-center">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 dark:text-blue-400 font-bold">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 p-4 md:p-8 font-antiqua">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 dark:text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:text-blue-400 font-bold mb-8 transition-colors"
        >
          <HiOutlineArrowLeft className="mr-2" /> BACK TO DASHBOARD
        </button>

        {/* Course Header */}
        <div className="bg-white dark:bg-slate-800 rounded-[40px] p-10 shadow-sm border border-gray-100 dark:border-slate-600 mb-8 text-left">
          <div className="flex items-center space-x-6">
            <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-lg">
              <HiOutlineBookOpen className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{courseData?.course_name}</h1>
              <p className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase">{courseData?.course_code}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Attendance Summary */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border border-gray-100 dark:border-slate-600 text-left">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <HiOutlineCalendar className="mr-2 text-blue-600 dark:text-blue-400" /> Attendance
              </h3>
              <div className="text-5xl font-black text-gray-900 dark:text-white mb-2">
                {courseData?.attendanceStats?.percentage}%
              </div>
              <p className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm font-bold uppercase mb-6">Current Standing</p>
              <div className="w-full bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
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
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border border-gray-100 dark:border-slate-600 text-left">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <HiOutlineDocumentText className="mr-2 text-blue-600 dark:text-blue-400" /> Class Notes
              </h3>
              <div className="space-y-4">
                {courseData?.notes?.length > 0 ? courseData.notes.map((note, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl border border-gray-100 dark:border-slate-600">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">{note.title}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{new Date(note.upload_date).toLocaleDateString()}</p>
                    </div>
                    <a href={note.file_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold text-sm">VIEW</a>
                  </div>
                )) : (
                  <p className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 italic">No notes uploaded yet.</p>
                )}
              </div>
            </div>

            {/* Assignments Section */}
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border border-gray-100 dark:border-slate-600 text-left">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <HiOutlineClipboardList className="mr-2 text-blue-600 dark:text-blue-400" /> Assignments
                {assignments.length > 0 && (
                  <span className="ml-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-black px-2 py-0.5 rounded-full">{assignments.length}</span>
                )}
              </h3>
              <div className="space-y-4">
                {assignments.length > 0 ? assignments.map((task) => {
                  const deadline = getDaysLeft(task.submission_deadline);
                  return (
                    <div key={task._id} className="p-5 bg-gray-50 dark:bg-slate-700 rounded-[24px] border border-transparent hover:border-blue-100 dark:border-blue-800 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                            task.assignment_type === 'mcq' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400' :
                            task.assignment_type === 'coding' ? 'bg-purple-100 text-purple-600 dark:text-purple-400 dark:text-purple-300 dark:text-purple-400' :
                            'bg-orange-100 text-orange-600'
                          }`}>{task.assignment_type}</span>
                          <p className="font-bold text-gray-800 dark:text-white leading-tight">{task.title}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${deadline.color}`}>
                          <HiOutlineClock className="shrink-0" />{deadline.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 dark:text-slate-500 mb-4 line-clamp-2">{task.instructions}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold">
                          Due: {new Date(task.submission_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <Link
                          to={`/hand-in/${task._id}`}
                          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all active:scale-95"
                        >
                          Attempt <HiOutlineChevronRight />
                        </Link>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 italic">No pending assignments.</p>
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