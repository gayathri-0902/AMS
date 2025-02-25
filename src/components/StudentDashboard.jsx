import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HiOutlineLogout } from "react-icons/hi";

function StudentDashboard() {
  const { auth, logout } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [subjectAttendance, setSubjectAttendance] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    if (!auth.studentId) return;

    const fetchTimetable = async () => {
      try {
        setLoadingTimetable(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/student-dashboard/${
            auth.studentId
          }`
        );
        setTimetable(response.data.timetableData || []);
      } catch (err) {
        console.error("Error fetching timetable", err);
      } finally {
        setLoadingTimetable(false);
      }
    };

    const fetchAttendance = async () => {
      try {
        setLoadingAttendance(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/attendance/${
            auth.studentId
          }`
        );
        setSubjectAttendance(response.data.subjectAttendance || []);
      } catch (err) {
        console.error("Error fetching attendance", err);
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchTimetable();
    fetchAttendance();
  }, [auth.studentId]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-8">
        Student Dashboard
      </h1>

      <button
        onClick={logout}
        className="absolute top-4 right-4 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
      >
        <HiOutlineLogout className="w-6 h-6" />
      </button>

      {/* Timetable Section */}
      <h2 className="text-xl font-semibold mb-4">Timetable for Today</h2>
      {loadingTimetable ? (
        <p>Loading timetable...</p>
      ) : timetable.length === 0 ? (
        <p className="text-center text-gray-600">No classes found for today.</p>
      ) : (
        <div className="space-y-4">
          {timetable.map((entry, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 bg-white shadow rounded-lg"
            >
              <div>
                <h3 className="text-lg font-medium">{entry.class_name}</h3>
                <p className="text-gray-600">{entry.class_code}</p>
                <p className="text-gray-600">Faculty: {entry.faculty_name}</p>
              </div>
              <p>
                Status:{" "}
                <span
                  className={`font-bold ${
                    entry.attendance_status === "Present"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {entry.attendance_status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Section */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Attendance</h2>
      {loadingAttendance ? (
        <p>Loading attendance...</p>
      ) : subjectAttendance.length === 0 ? (
        <p className="text-center text-gray-600">
          No attendance records found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Class</th>
                <th className="border p-2">Code</th>
                <th className="border p-2">Present</th>
                <th className="border p-2">Absent</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {subjectAttendance.map((subject, index) => (
                <tr key={index} className="text-center">
                  <td className="border p-2">{subject.class_name}</td>
                  <td className="border p-2">{subject.class_code}</td>
                  <td className="border p-2">{subject.present_count}</td>
                  <td className="border p-2">{subject.total_count - subject.present_count}</td>
                  <td className="border p-2">{subject.total_count}</td>
                  <td className="border p-2 font-bold">
                    {subject.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
