import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MdAdminPanelSettings,
  MdArrowBack,
  MdCheckCircle,
  MdMenuBook,
  MdGroup,
  MdCastForEducation,
  MdCalendarMonth,
  MdAdd,
} from "react-icons/md";

const AdminTimetable = () => {
  const navigate = useNavigate();

  /* ================= BATCH INFO ================= */
  const [batchInfo, setBatchInfo] = useState({
    yr: "",
    academic_yr: "",
    stream: "",
    sem: "",
  });

  /* ================= DYNAMIC ARRAYS ================= */
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [timetable, setTimetable] = useState([]);

  /* ================= STEP FLAGS ================= */
  const [batchSaved, setBatchSaved] = useState(false);
  const [batchLocked, setBatchLocked] = useState(false);
  const [coursesSaved, setCoursesSaved] = useState(false);
  const [facultySetupDone, setFacultySetupDone] = useState(false);
  const [usersLocked, setUsersLocked] = useState(false);

  /* ================= PAYLOAD BUILDERS ================= */
  const buildBatchPayload = () => ({
    batch_info: {
      yr: Number(batchInfo.yr),
      sem: Number(batchInfo.sem),
      stream: batchInfo.stream.trim(),
      academic_yr: batchInfo.academic_yr.trim(),
    },
  });

  const buildCoursesPayload = () => ({
    courses_entries: courses.filter(
      (c) => c.course_code?.trim() && c.course_name?.trim() && c.credits !== ""
    ),
  });

  const buildFacultyPayload = () => ({
    users_entries: users.filter(
      (u) => u.user_name?.trim() && u.password?.trim()
    ),
    faculties_entries: faculties.filter(
      (f) => f.name?.trim() && f.email?.trim()
    ),
  });

  const buildSubjectOfferingPayload = () => ({
    ...buildBatchPayload(),
    courses_entries: courses.filter((c) => c.course_code?.trim()),
  });

  const buildTimetablePayload = () => ({
    ...buildBatchPayload(),
    timetable_entries: timetable.filter(
      (t) =>
        t.day_of_week &&
        t.session_number !== "" &&
        t.course_code?.trim() &&
        t.location?.trim()
    ),
  });

  /* ================= API CALLS ================= */
  const saveBatchInfo = async () => {
    const { yr, sem, stream, academic_yr } = batchInfo;
    if (!yr || !sem || !stream.trim() || !academic_yr.trim()) {
      alert("Fill all batch fields");
      return;
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/ensure-yrsem`,
        buildBatchPayload()
      );
      alert(res.data.message);
      setBatchSaved(true);
      setBatchLocked(true);
    } catch (err) {
      if (err.response?.status === 409) {
        alert(err.response.data.message);
        setBatchSaved(true);
        setBatchLocked(true);
      } else {
        alert("Batch setup failed");
      }
    }
  };

  const saveCourses = async () => {
    const payload = buildCoursesPayload();
    if (payload.courses_entries.length === 0) {
      alert("No valid courses to save");
      return;
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/ensure-course-masters`,
        payload
      );
      alert(res.data.message);
    } catch (err) {
      if (err.response?.status === 409) {
        alert(err.response.data.message);
      } else {
        alert("Saving courses failed");
      }
    }
  };

  const saveSubjectOfferings = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/ensure-subject-offerings`,
        buildSubjectOfferingPayload()
      );
      alert(res.data.message);
    } catch (err) {
      if (err.response?.status === 409) {
        alert(err.response.data.message);
      } else {
        alert("Subject offering setup failed");
      }
    }
  };

  const setupFacultyAndMappings = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/setup-faculty`,
        buildFacultyPayload()
      );
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/ensure-subject-offerings`,
        buildSubjectOfferingPayload()
      );
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/ensure-faculty-assignments`,
        buildSubjectOfferingPayload()
      );
      setFacultySetupDone(true);
      alert("Faculty & subject setup completed");
    } catch (err) {
      if (err.response?.status === 409) {
        setFacultySetupDone(true);
        alert(err.response.data.message);
        return;
      }
      alert(err.response?.data?.message || "Faculty setup failed");
    }
  };

  const saveTimetable = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/ensure-timetable`,
        buildTimetablePayload()
      );
      alert(res.data.message);
    } catch (err) {
      if (err.response?.status === 409) {
        alert(err.response.data.message);
      } else {
        alert("Timetable setup failed");
      }
    }
  };

  /* ================= ADD ROW HANDLERS ================= */
  const addCourse = () =>
    setCourses([...courses, { course_code: "", course_name: "", faculty_name: "", credits: "" }]);

  const addUser = () =>
    setUsers([...users, { user_name: "", password: "", role: "faculty" }]);

  const addFaculty = () =>
    setFaculties([...faculties, { name: "", email: "" }]);

  const addTimetable = () =>
    setTimetable([
      ...timetable,
      { day_of_week: "Monday", session_number: "", start_time: "", end_time: "", course_code: "", location: "" },
    ]);

  /* ================= NAVIGATION HANDLERS ================= */
  const goToFacultyStep = () => {
    const payload = buildFacultyPayload();
    if (payload.users_entries.length === 0) {
      alert("Add at least one valid user");
      return;
    }
    setUsersLocked(true);
  };

  /* ================= REUSABLE STYLES ================= */
  const inputClass = "w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-[#2b2b2b] text-[15px] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all disabled:bg-[#f8fafc] disabled:text-[#94a3b8] disabled:cursor-not-allowed";
  const selectClass = "w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-[#2b2b2b] text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all disabled:bg-[#f8fafc] disabled:text-[#94a3b8] disabled:cursor-not-allowed";
  const cardClass = "bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white";
  const disabledCardClass = "bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white opacity-50 pointer-events-none";
  const colLabelClass = "text-[13px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-1";

  const StatusBadge = ({ text }) => (
    <span className="ml-auto text-[13px] text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full border border-green-100">
      ✓ {text}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-8 font-antiqua">

      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <MdAdminPanelSettings size={36} className="text-[#3b82f6]" />
          <h2 className="text-[32px] text-[#2b2b2b]">Add Timetable</h2>
        </div>
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#3b82f6] text-[#3b82f6] rounded-xl hover:bg-[#3b82f6] hover:text-white transition-all duration-300 shadow-sm group"
        >
          <MdArrowBack size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[17px]">Back to Dashboard</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-8">

        {/* ===== STEP 1: BATCH INFO ===== */}
        <div className={cardClass}>
          <h3 className="text-[20px] text-[#2b2b2b] mb-5 flex items-center gap-2">
            <MdCheckCircle size={24} className={batchLocked ? "text-green-500" : "text-[#3b82f6]"} />
            Step 1 — Batch Information
            {batchLocked && <StatusBadge text="Confirmed" />}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className={colLabelClass}>Year</p>
              <input
                type="number"
                placeholder="e.g. 3"
                className={inputClass}
                value={batchInfo.yr}
                disabled={batchLocked}
                onChange={(e) => setBatchInfo({ ...batchInfo, yr: e.target.value })}
              />
            </div>
            <div>
              <p className={colLabelClass}>Semester</p>
              <input
                type="number"
                placeholder="e.g. 1"
                className={inputClass}
                value={batchInfo.sem}
                disabled={batchLocked}
                onChange={(e) => setBatchInfo({ ...batchInfo, sem: e.target.value })}
              />
            </div>
            <div>
              <p className={colLabelClass}>Stream</p>
              <input
                type="text"
                placeholder="e.g. CSDS"
                className={inputClass}
                value={batchInfo.stream}
                disabled={batchLocked}
                onChange={(e) => setBatchInfo({ ...batchInfo, stream: e.target.value })}
              />
            </div>
            <div>
              <p className={colLabelClass}>Academic Year</p>
              <input
                type="text"
                placeholder="e.g. 2023-2027"
                className={inputClass}
                value={batchInfo.academic_yr}
                disabled={batchLocked}
                onChange={(e) => setBatchInfo({ ...batchInfo, academic_yr: e.target.value })}
              />
            </div>
          </div>

          <button
            className="bg-[#3b82f6] text-white px-8 py-3 rounded-xl text-[16px] hover:bg-[#2563eb] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={saveBatchInfo}
            disabled={batchLocked}
          >
            {batchLocked ? "Batch Confirmed" : "Confirm Batch"}
          </button>
        </div>


        {/* ===== STEP 2: COURSES ===== */}
        <div className={batchSaved ? cardClass : disabledCardClass}>
          <h3 className="text-[20px] text-[#2b2b2b] mb-5 flex items-center gap-2">
            <MdMenuBook size={24} className={coursesSaved ? "text-green-500" : "text-green-600"} />
            Step 2 — Courses
            {!batchSaved
              ? <span className="ml-auto text-[13px] text-[#94a3b8] italic">Confirm batch first</span>
              : coursesSaved && <StatusBadge text="Saved" />
            }
          </h3>

          {courses.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-2">
              <p className={colLabelClass}>Course Code</p>
              <p className={colLabelClass}>Course Name</p>
              <p className={colLabelClass}>Faculty Name</p>
              <p className={colLabelClass}>Credits</p>
            </div>
          )}

          <div className="space-y-3 mb-5">
            {courses.map((c, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-4">
                <input
                  placeholder="Course Code"
                  className={inputClass}
                  value={c.course_code}
                  disabled={!batchSaved || coursesSaved}
                  onChange={(e) => {
                    const copy = [...courses];
                    copy[idx].course_code = e.target.value;
                    setCourses(copy);
                  }}
                />
                <input
                  placeholder="Course Name"
                  className={inputClass}
                  value={c.course_name}
                  disabled={!batchSaved || coursesSaved}
                  onChange={(e) => {
                    const copy = [...courses];
                    copy[idx].course_name = e.target.value;
                    setCourses(copy);
                  }}
                />
                <input
                  placeholder="Faculty Name"
                  className={inputClass}
                  value={c.faculty_name}
                  disabled={!batchSaved || coursesSaved}
                  onChange={(e) => {
                    const copy = [...courses];
                    copy[idx].faculty_name = e.target.value;
                    setCourses(copy);
                  }}
                />
                <input
                  type="number"
                  placeholder="Credits"
                  className={inputClass}
                  value={c.credits}
                  disabled={!batchSaved || coursesSaved}
                  onChange={(e) => {
                    const copy = [...courses];
                    copy[idx].credits = e.target.value;
                    setCourses(copy);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              className="flex items-center gap-2 px-5 py-2.5 border border-[#3b82f6] text-[#3b82f6] rounded-xl text-[15px] hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={addCourse}
              disabled={!batchSaved || coursesSaved}
            >
              <MdAdd size={20} /> Add Course
            </button>
            <button
              className="bg-[#16a34a] text-white px-8 py-2.5 rounded-xl text-[15px] hover:bg-[#15803d] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={async () => {
                await saveCourses();
                setCoursesSaved(true);
              }}
              disabled={!batchSaved || coursesSaved}
            >
              {coursesSaved ? "Courses Saved" : "Save Courses"}
            </button>
          </div>
        </div>


        {/* ===== STEP 3: USERS ===== */}
        <div className={coursesSaved ? cardClass : disabledCardClass}>
          <h3 className="text-[20px] text-[#2b2b2b] mb-5 flex items-center gap-2">
            <MdGroup size={24} className={usersLocked ? "text-green-500" : "text-purple-600"} />
            Step 3 — Users
            {!coursesSaved
              ? <span className="ml-auto text-[13px] text-[#94a3b8] italic">Save courses first</span>
              : usersLocked && <StatusBadge text="Locked" />
            }
          </h3>

          {users.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-2">
              <p className={colLabelClass}>Email</p>
              <p className={colLabelClass}>Password</p>
              <p className={colLabelClass}>Role</p>
            </div>
          )}

          <div className="space-y-3 mb-5">
            {users.map((u, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-4">
                <input
                  placeholder="Email"
                  className={inputClass}
                  value={u.user_name}
                  disabled={!coursesSaved || usersLocked}
                  onChange={(e) => {
                    const copy = [...users];
                    copy[idx].user_name = e.target.value;
                    setUsers(copy);
                  }}
                />
                <input
                  placeholder="Password"
                  type="password"
                  className={inputClass}
                  value={u.password}
                  disabled={!coursesSaved || usersLocked}
                  onChange={(e) => {
                    const copy = [...users];
                    copy[idx].password = e.target.value;
                    setUsers(copy);
                  }}
                />
                <select
                  className={selectClass}
                  value={u.role}
                  disabled={!coursesSaved || usersLocked}
                  onChange={(e) => {
                    const copy = [...users];
                    copy[idx].role = e.target.value;
                    setUsers(copy);
                  }}
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              className="flex items-center gap-2 px-5 py-2.5 border border-[#9333ea] text-[#9333ea] rounded-xl text-[15px] hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={addUser}
              disabled={!coursesSaved || usersLocked}
            >
              <MdAdd size={20} /> Add User
            </button>
            <button
              className="bg-[#9333ea] text-white px-8 py-2.5 rounded-xl text-[15px] hover:bg-[#7e22ce] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={goToFacultyStep}
              disabled={!coursesSaved || usersLocked}
            >
              {usersLocked ? "Users Locked" : "Next"}
            </button>
          </div>
        </div>


        {/* ===== STEP 4: FACULTIES ===== */}
        <div className={usersLocked ? cardClass : disabledCardClass}>
          <h3 className="text-[20px] text-[#2b2b2b] mb-5 flex items-center gap-2">
            <MdCastForEducation size={24} className={facultySetupDone ? "text-green-500" : "text-indigo-600"} />
            Step 4 — Faculties
            {!usersLocked
              ? <span className="ml-auto text-[13px] text-[#94a3b8] italic">Complete users step first</span>
              : facultySetupDone && <StatusBadge text="Setup Complete" />
            }
          </h3>

          {faculties.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-2">
              <p className={colLabelClass}>Faculty Name</p>
              <p className={colLabelClass}>Faculty Email</p>
            </div>
          )}

          <div className="space-y-3 mb-5">
            {faculties.map((f, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Faculty Name"
                  className={inputClass}
                  value={f.name}
                  disabled={!usersLocked || facultySetupDone}
                  onChange={(e) => {
                    const copy = [...faculties];
                    copy[idx].name = e.target.value;
                    setFaculties(copy);
                  }}
                />
                <input
                  placeholder="Faculty Email"
                  type="email"
                  className={inputClass}
                  value={f.email}
                  disabled={!usersLocked || facultySetupDone}
                  onChange={(e) => {
                    const copy = [...faculties];
                    copy[idx].email = e.target.value;
                    setFaculties(copy);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              className="flex items-center gap-2 px-5 py-2.5 border border-[#4f46e5] text-[#4f46e5] rounded-xl text-[15px] hover:bg-indigo-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={addFaculty}
              disabled={!usersLocked || facultySetupDone}
            >
              <MdAdd size={20} /> Add Faculty
            </button>
            <button
              className="bg-[#4f46e5] text-white px-8 py-2.5 rounded-xl text-[15px] hover:bg-[#4338ca] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={setupFacultyAndMappings}
              disabled={!usersLocked || facultySetupDone}
            >
              {facultySetupDone ? "Faculty Setup Completed" : "Setup Faculty & Subjects"}
            </button>
          </div>
        </div>


        {/* ===== STEP 5: TIMETABLE ===== */}
        <div className={facultySetupDone ? cardClass : disabledCardClass}>
          <h3 className="text-[20px] text-[#2b2b2b] mb-5 flex items-center gap-2">
            <MdCalendarMonth size={24} className="text-[#3b82f6]" />
            Step 5 — Timetable Entries
            {!facultySetupDone && (
              <span className="ml-auto text-[13px] text-[#94a3b8] italic">Complete faculty setup first</span>
            )}
          </h3>

          {timetable.length > 0 && (
            <div className="grid grid-cols-6 gap-3 mb-2">
              <p className={colLabelClass}>Day</p>
              <p className={colLabelClass}>Session</p>
              <p className={colLabelClass}>Start Time</p>
              <p className={colLabelClass}>End Time</p>
              <p className={colLabelClass}>Course Code</p>
              <p className={colLabelClass}>Location</p>
            </div>
          )}

          <div className="space-y-3 mb-5">
            {timetable.map((t, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-3">
                <select
                  className={selectClass}
                  value={t.day_of_week}
                  disabled={!facultySetupDone}
                  onChange={(e) => {
                    const copy = [...timetable];
                    copy[idx].day_of_week = e.target.value;
                    setTimetable(copy);
                  }}
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Session"
                  className={inputClass}
                  value={t.session_number}
                  disabled={!facultySetupDone}
                  onChange={(e) => {
                    const copy = [...timetable];
                    copy[idx].session_number = e.target.value;
                    setTimetable(copy);
                  }}
                />
                <input
                  type="time"
                  className={inputClass}
                  value={t.start_time}
                  disabled={!facultySetupDone}
                  onChange={(e) => {
                    const copy = [...timetable];
                    copy[idx].start_time = e.target.value;
                    setTimetable(copy);
                  }}
                />
                <input
                  type="time"
                  className={inputClass}
                  value={t.end_time}
                  disabled={!facultySetupDone}
                  onChange={(e) => {
                    const copy = [...timetable];
                    copy[idx].end_time = e.target.value;
                    setTimetable(copy);
                  }}
                />
                <input
                  placeholder="Course Code"
                  className={inputClass}
                  value={t.course_code}
                  disabled={!facultySetupDone}
                  onChange={(e) => {
                    const copy = [...timetable];
                    copy[idx].course_code = e.target.value;
                    setTimetable(copy);
                  }}
                />
                <input
                  placeholder="Location"
                  className={inputClass}
                  value={t.location}
                  disabled={!facultySetupDone}
                  onChange={(e) => {
                    const copy = [...timetable];
                    copy[idx].location = e.target.value;
                    setTimetable(copy);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              className="flex items-center gap-2 px-5 py-2.5 border border-[#3b82f6] text-[#3b82f6] rounded-xl text-[15px] hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={addTimetable}
              disabled={!facultySetupDone}
            >
              <MdAdd size={20} /> Add Entry
            </button>
            <button
              className="bg-[#3b82f6] text-white px-8 py-2.5 rounded-xl text-[15px] hover:bg-[#2563eb] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={saveTimetable}
              disabled={!facultySetupDone}
            >
              Save Timetable
            </button>
          </div>
        </div>

      </div>

      <footer className="max-w-6xl mx-auto mt-12 mb-8 text-center text-[16px] text-[#94a3b8] italic">
        © 2026 Campus Management System
      </footer>

    </div>
  );
};

export default AdminTimetable;