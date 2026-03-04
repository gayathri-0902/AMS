import { useState } from "react";
import axios from "axios";

const AdminTimetable = () => {
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


  const [batchSaved, setBatchSaved] = useState(false);
  const [batchLocked, setBatchLocked] = useState(false);
  const [coursesSaved, setCoursesSaved] = useState(false);
  const [facultySetupDone, setFacultySetupDone] = useState(false);
  const [usersLocked, setUsersLocked] = useState(false);


  /*====================payload builder fucntions==============*/

  const buildBatchPayload = () => ({
    batch_info: {
      yr: Number(batchInfo.yr),
      sem: Number(batchInfo.sem),
      stream: batchInfo.stream.trim(),
      academic_yr: batchInfo.academic_yr.trim()
    }
  });

  const buildCoursesPayload = () => ({
    courses_entries: courses.filter(
      c =>
        c.course_code?.trim() &&
        c.course_name?.trim() &&
        c.credits !== ""
    )
  });

  const buildFacultyPayload = () => ({
    users_entries: users.filter(
      u => u.user_name?.trim() && u.password?.trim()
    ),
    faculties_entries: faculties.filter(
      f => f.name?.trim() && f.email?.trim()
    )
  });

  const buildSubjectOfferingPayload = () => ({
    ...buildBatchPayload(),
    courses_entries: courses.filter(c => c.course_code?.trim())
  });

  const buildTimetablePayload = () => ({
    ...buildBatchPayload(),
    timetable_entries: timetable.filter(
      t =>
        t.day_of_week &&
        t.session_number !== "" &&
        t.course_code?.trim() &&
        t.location?.trim()
    )
  });


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

      // 200 → created
      alert(res.data.message);

      setBatchSaved(true);
      setBatchLocked(true);

    } catch (err) {
      if (err.response?.status === 409) {
        // already exists → still valid
        alert(err.response.data.message);

        setBatchSaved(true);
        setBatchLocked(true);
      } else {
        alert("Batch setup failed");
      }
    }
  };



  /* ================= API CALL FUNCTIONS ====================*/

  const setupFacultyAndMappings = async () => {
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/setup-faculty`, buildFacultyPayload());
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ensure-subject-offerings`, buildSubjectOfferingPayload());
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/ensure-faculty-assignments`, buildSubjectOfferingPayload());

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
      {
        day_of_week: "Monday",
        session_number: "",
        start_time: "",
        end_time: "",
        course_code: "",
        location: "",
      },
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


  

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold"> Add Timetable</h1>

      {/* ================= BATCH INFO ================= */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Batch Information</h2>

        {/* Column Labels */}
        <div className="flex flex-wrap gap-2 mb-1 font-semibold text-sm">
          <div className="w-40">Year</div>
          <div className="w-40">Semester</div>
          <div className="w-48">Stream</div>
          <div className="w-56">Academic Year</div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="number"
            placeholder="e.g. 3"
            className="border p-2 w-40"
            value={batchInfo.yr}
            disabled={Boolean(batchLocked)}
            onChange={e =>
              setBatchInfo({ ...batchInfo, yr: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="e.g. 1"
            className="border p-2 w-40"
            value={batchInfo.sem}
            disabled={Boolean(batchLocked)}
            onChange={e =>
              setBatchInfo({ ...batchInfo, sem: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="e.g. CSDS"
            className="border p-2 w-48"
            value={batchInfo.stream}
            disabled={Boolean(batchLocked)}
            onChange={e =>
              setBatchInfo({ ...batchInfo, stream: e.target.value })
            }
          />

          <input
            type="text"
            placeholder=" e.g. 2023-2027"
            className="border p-2 w-56"
            value={batchInfo.academic_yr}
            disabled={Boolean(batchLocked)}
            onChange={e =>
              setBatchInfo({ ...batchInfo, academic_yr: e.target.value })
            }
          />
        </div>
          
        <button
          className="bg-green-600 text-white px-6 py-2 rounded"
          onClick={saveBatchInfo}
          disabled={Boolean(batchLocked)}
        >
          {batchLocked ? "Batch Confirmed" : "Confirm Batch"}
        </button>
      </section>


      {/* ================= COURSES ================= */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Courses</h2>

        {!batchSaved && (
          <p className="text-sm text-red-500 mb-2">
            Confirm batch information to add courses.
          </p>
        )}

        {/* Column Labels */}
        {courses.length > 0 && (
          <div className="flex gap-2 mb-1 font-semibold text-sm">
            <div className="w-40">Course Code</div>
            <div className="w-64">Course Name</div>
            <div className="w-48">Faculty Name</div>
            <div className="w-24">Credits</div>
          </div>
        )}

        {/* Rows */}
        {courses.map((c, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              placeholder="Course Code"
              className="border p-2 w-40"
              value={c.course_code}
              disabled={Boolean(!batchSaved || coursesSaved)}
              onChange={e => {
                const copy = [...courses];
                copy[idx].course_code = e.target.value;
                setCourses(copy);
              }}
            />

            <input
              placeholder="Course Name"
              className="border p-2 w-64"
              value={c.course_name}
              disabled={Boolean(!batchSaved || coursesSaved)}
              onChange={e => {
                const copy = [...courses];
                copy[idx].course_name = e.target.value;
                setCourses(copy);
              }}
            />

            <input
              placeholder="Faculty Name"
              className="border p-2 w-48"
              value={c.faculty_name}
              disabled={Boolean(!batchSaved || coursesSaved)}
              onChange={e => {
                const copy = [...courses];
                copy[idx].faculty_name = e.target.value;
                setCourses(copy);
              }}
            />

            <input
              type="number"
              placeholder="Credits"
              className="border p-2 w-24"
              value={c.credits}
              disabled={Boolean(!batchSaved || coursesSaved)}
              onChange={e => {
                const copy = [...courses];
                copy[idx].credits = e.target.value;
                setCourses(copy);
              }}
            />
          </div>
        ))}

        <div className="flex gap-2 mt-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addCourse}
            disabled={Boolean(!batchSaved || coursesSaved)}
          >
            + Add Course
          </button>
      
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={async () => {
              await saveCourses();
              setCoursesSaved(true);
            }}
            disabled={Boolean(!batchSaved || coursesSaved)}
          >
            {coursesSaved ? "Courses Saved" : "Save Courses"}
          </button>
        </div>
      </section>


      {/* ================= USERS ================= */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Users</h2>

        {!coursesSaved && (
          <p className="text-sm text-red-500 mb-2">
            Save courses before adding users.
          </p>
        )}

        {/* Column Labels */}
        {users.length > 0 && (
          <div className="flex gap-2 mb-1 font-semibold text-sm">
            <div className="w-64">Email</div>
            <div className="w-48">Password</div>
            <div className="w-32">Role</div>
          </div>
        )}

        {/* Rows */}
        {users.map((u, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              placeholder="Email"
              className="border p-2"
              value={u.user_name}
              disabled={Boolean(!coursesSaved || usersLocked)}
              onChange={e => {
                const copy = [...users];
                copy[idx].user_name = e.target.value;
                setUsers(copy);
              }}
            />

            <input
              placeholder="Password"
              className="border p-2"
              value={u.password}
              disabled={Boolean(!coursesSaved || usersLocked)}
              onChange={e => {
                const copy = [...users];
                copy[idx].password = e.target.value;
                setUsers(copy);
              }}
            />

            <select
              className="border p-2"
              value={u.role}
              disabled={Boolean(!coursesSaved || usersLocked)}
              onChange={e => {
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

        <div className="flex gap-2 mt-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addUser}
            disabled={Boolean(!coursesSaved || usersLocked)}
          >
            + Add User
          </button>
      
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={goToFacultyStep}
            disabled={Boolean(!coursesSaved || usersLocked)}
          >
            {usersLocked ? "Users Locked" : "Next"}
          </button>
        </div>
      </section>


      {/* ================= FACULTIES ================= */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Faculties</h2>

        {!usersLocked && (
          <p className="text-sm text-red-500 mb-2">
            Complete Users step before adding faculties.
          </p>
        )}

        {/* Column Labels */}
        {faculties.length > 0 && (
          <div className="flex gap-2 mb-1 font-semibold text-sm">
            <div className="w-56">Faculty Name</div>
            <div className="w-72">Faculty Email</div>
          </div>
        )}

        {/* Rows */}

        {faculties.map((f, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              placeholder="Faculty Name"
              className="border p-2"
              value={f.name}
              disabled={Boolean(!usersLocked || facultySetupDone)}
              onChange={e => {
                const copy = [...faculties];
                copy[idx].name = e.target.value;
                setFaculties(copy);
              }}
            />

            <input
              placeholder="Faculty Email"
              className="border p-2"
              value={f.email}
              disabled={Boolean(!usersLocked || facultySetupDone)}
              onChange={e => {
                const copy = [...faculties];
                copy[idx].email = e.target.value;
                setFaculties(copy);
              }}
            />
          </div>
        ))}

        <div className="flex gap-2 mt-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addFaculty}
            disabled={Boolean(!usersLocked || facultySetupDone)}
          >
            + Add Faculty
          </button>
      
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={Boolean(!usersLocked || facultySetupDone)}
            onClick={setupFacultyAndMappings}
          >
            {facultySetupDone
              ? "Faculty Setup Completed"
              : "Setup Faculty & Subjects"}
          </button>
        </div>
      </section>


      {/* ================= TIMETABLE ================= */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Timetable</h2>

        {!facultySetupDone && (
          <p className="text-sm text-red-500 mb-2">
            Complete faculty setup before adding timetable entries.
          </p>
        )}

        {/* Column Labels */}
        {timetable.length > 0 && (
          <div className="flex gap-2 mb-1 font-semibold text-sm">
            <div className="w-40">Day</div>
            <div className="w-24">Session</div>
            <div className="w-32">Start Time</div>
            <div className="w-32">End Time</div>
            <div className="w-40">Course Code</div>
            <div className="w-40">Location</div>
          </div>
        )}

        {/* Rows */}

        {timetable.map((t, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <select
              className="border p-2 w-40"
              value={t.day_of_week}
              disabled={Boolean(!facultySetupDone)}
              onChange={e => {
                const copy = [...timetable];
                copy[idx].day_of_week = e.target.value;
                setTimetable(copy);
              }}
            >
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
            
            <input
              type="number"
              placeholder="Session"
              className="border p-2 w-24"
              value={t.session_number}
              disabled={Boolean(!facultySetupDone)}
              onChange={e => {
                const copy = [...timetable];
                copy[idx].session_number = e.target.value;
                setTimetable(copy);
              }}
            />

            <input
              type="time"
              className="border p-2 w-32"
              value={t.start_time}
              disabled={Boolean(!facultySetupDone)}
              onChange={e => {
                const copy = [...timetable];
                copy[idx].start_time = e.target.value;
                setTimetable(copy);
              }}
            />

            <input
              type="time"
              className="border p-2 w-32"
              value={t.end_time}
              disabled={Boolean(!facultySetupDone)}
              onChange={e => {
                const copy = [...timetable];
                copy[idx].end_time = e.target.value;
                setTimetable(copy);
              }}
            />

            <input
              placeholder="Course Code"
              className="border p-2 w-40"
              value={t.course_code}
              disabled={Boolean(!facultySetupDone)}
              onChange={e => {
                const copy = [...timetable];
                copy[idx].course_code = e.target.value;
                setTimetable(copy);
              }}
            />

            <input
              placeholder="Location"
              className="border p-2 w-40"
              value={t.location}
              disabled={Boolean(!facultySetupDone)}
              onChange={e => {
                const copy = [...timetable];
                copy[idx].location = e.target.value;
                setTimetable(copy);
              }}
            />
          </div>
        ))}

        <div className="flex gap-2 mt-3">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addTimetable}
            disabled={Boolean(!facultySetupDone)}
          >
            + Add Timetable
          </button>
      
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={saveTimetable}
            disabled={Boolean(!facultySetupDone)}
          >
            Save Timetable
          </button>
        </div>
      </section>

    </div>
  );
};

export default AdminTimetable;