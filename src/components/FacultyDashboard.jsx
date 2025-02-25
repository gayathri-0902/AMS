import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HiOutlineLogout } from "react-icons/hi";

function FacultyDashboard() {
  const { auth, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isFormVisible, setIsFormVisible] = useState(true); // State to toggle form visibility
  const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (!auth.facultyId) {
          console.log("No facultyId found.");
          return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/faculty-dashboard/${
            auth.facultyId
          }`
        );
        setClasses(response.data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    if (auth.facultyId) {
      fetchClasses();
    }
  }, [auth.facultyId]);

  const handleClassSelection = async (cls) => {
    setSelectedClass(cls);
    setIsFormVisible(true);
    setAttendanceMarked(false);
    setAttendance({});
    try {
      const studentResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/faculty-dashboard/students/${
          cls.section_id
        }`
      );
      setStudents(studentResponse.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCheckboxChange = (studentId, isChecked) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: isChecked ? "Present" : "Absent",
    }));
  };

  const handleMarkAllPresent = () => {
    const newAttendance = students.reduce((acc, student) => {
      acc[student._id] = "Present";
      return acc;
    }, {});
    setAttendance(newAttendance);
  };

  const handleMarkAttendance = async () => {
    if (!selectedClass) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/attendance`, {
        classId: selectedClass.class_id,
        attendanceData: attendance,
      });
      setAttendanceMarked(true);
      setIsModalVisible(true); // Show the modal after successful submission
      setTimeout(() => setIsModalVisible(false), 2000); // Hide modal after 3 seconds
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const toggleFormVisibility = () => {
    setIsFormVisible((prevState) => !prevState);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-8">
        Faculty Dashboard
      </h1>
      <button
        onClick={logout}
        className="absolute top-4 right-4 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
      >
        <HiOutlineLogout className="w-6 h-6" />
      </button>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
        <div className="space-y-4">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <div
                key={cls.class_id}
                className="flex justify-between items-center p-4 bg-white shadow rounded-lg"
              >
                <div>
                  <h3 className="text-lg font-medium">{cls.class_name}</h3>
                  <p className="text-gray-600">{cls.section_name}</p>
                </div>
                <button
                  onClick={() => handleClassSelection(cls)}
                  className={`px-4 py-2 rounded-lg hover:bg-blue-600 ${
                    selectedClass?.class_id === cls.class_id
                      ? "bg-blue-700 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {attendanceMarked[cls.class_id]
                    ? "Attendance Marked"
                    : "Mark Attendance"}
                </button>
              </div>
            ))
          ) : (
            <p>No classes found for today.</p>
          )}
        </div>
      </div>

      {classes.length > 0 && (
        <button
          onClick={toggleFormVisibility}
          className="mb-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          {isFormVisible ? "Hide" : "Show"} Class Details
        </button>
      )}

      {selectedClass && isFormVisible && (
        <div className="mt-8 p-6 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium mb-4">Selected Class Details</h3>
          <p>
            <strong>Class Name:</strong> {selectedClass.class_name}
          </p>
          <p>
            <strong>Section:</strong> {selectedClass.section_name}
          </p>

          <div className="flex justify-between">
            <h4 className="text-xl font-medium mt-4 mb-2">
              Students in the Class
            </h4>
            <button
              onClick={handleMarkAllPresent}
              className="mb-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Mark All Present
            </button>
          </div>

          <form>
            <ul className="space-y-4">
              {students.length > 0 ? (
                students.map((student) => (
                  <li
                    key={student._id}
                    className="flex items-center justify-between p-4 rounded-lg shadow  hover:bg-gray-100 cursor-pointer"
                    onClick={() =>
                      handleCheckboxChange(
                        student._id,
                        !attendance[student._id]
                      )
                    }
                  >
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-gray-800">
                        {student.student_id_no}
                      </span>
                      <span className="text-xl font-semibold text-gray-600">
                        {student.student_name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <label
                        htmlFor={`student-${student._id}`}
                        className="mr-2 font-medium text-gray-700"
                      ></label>
                      <input
                        type="checkbox"
                        id={`student-${student._id}`}
                        name={`student-${student._id}`}
                        checked={attendance[student._id] === "Present"}
                        onChange={(e) =>
                          handleCheckboxChange(student._id, e.target.checked)
                        }
                        className="w-6 h-6 bg-green-500"
                      />
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-gray-600 text-center">
                  No students found in this section.
                </li>
              )}
            </ul>
          </form>

          <button
            onClick={handleMarkAttendance}
            className={`mt-4 px-6 py-2 rounded-lg text-white ${
              attendanceMarked ? "bg-green-500" : "bg-blue-500"
            } hover:${!attendanceMarked && "bg-blue-600"}`}
            disabled={attendanceMarked}
          >
            {attendanceMarked ? "Submitted" : "Submit"}
          </button>
        </div>
      )}

      {/* Modal for confirming attendance submission */}
      {isModalVisible && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold">
              Attendance Marked Successfully!
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;
