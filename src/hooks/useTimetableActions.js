import { useState } from "react";
import axios from "axios";

/**
 * Manages timetable-specific actions: adding/editing sessions.
 * 
 * @param {object} deps
 * @param {object} deps.batchData - Current batch data
 * @param {Function} deps.refetchBatchData - Function to refresh batch data
 * @param {Function} deps.setActiveModal - Function to control modal visibility
 */
export function useTimetableActions({ batchData, refetchBatchData, setActiveModal }) {
    const [addSessionForm, setAddSessionForm] = useState({
        day: "",
        session: "",
        start_time: "",
        end_time: "",
        course: "", // course_code
        faculty: "", // email
        location: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAddSessionChange = (e) => {
        const { name, value } = e.target;
        setAddSessionForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleOpenAddSession = () => {
        setAddSessionForm({
            day: "Monday",
            session: "",
            start_time: "",
            end_time: "",
            course: "",
            faculty: "",
            location: "",
        });
        setError(null);
        setActiveModal("addSession");
    };

    const handleAddSessionSubmit = async (e) => {
        e?.preventDefault();
        if (!batchData?.yr_sem_id) return;

        setLoading(true);
        setError(null);

        // Strict Client-Side Validation
        const { day, session, start_time, end_time, course, faculty, location } = addSessionForm;
        if (!day || !session || !start_time || !end_time || !course || !faculty || !location) {
            setError("All fields are mandatory. Please fill in all input values before proceeding.");
            setLoading(false);
            return;
        }

        // Logic Validation: Session Number must be positive
        if (Number(session) < 1) {
            setError("Session number must be 1 or greater.");
            setLoading(false);
            return;
        }

        // Logic Validation: Start Time < End Time
        if (start_time >= end_time) {
            setError("Class Start Time must be earlier than the End Time.");
            setLoading(false);
            return;
        }

        // Find the course code from the selected name
        const selectedCourse = batchData.courses?.find(c => c.course_name === addSessionForm.course);
        const courseCode = selectedCourse?.course_code || addSessionForm.course;
        console.log({

            yr_sem_id: batchData.yr_sem_id,
            course_code: courseCode,
            faculty_email: addSessionForm.faculty,
            day: addSessionForm.day,
            start_time: addSessionForm.start_time,
            end_time: addSessionForm.end_time,
            location: addSessionForm.location,
            session_no: addSessionForm.session,

        })
        try {
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/schedule`,
                {
                    yr_sem_id: batchData.yr_sem_id,
                    course_code: courseCode,
                    faculty_email: addSessionForm.faculty,
                    day: addSessionForm.day,
                    start_time: addSessionForm.start_time,
                    end_time: addSessionForm.end_time,
                    location: addSessionForm.location,
                    session_no: addSessionForm.session,
                }
            );

            setActiveModal(null);
            await refetchBatchData();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to add session");
        } finally {
            setLoading(false);
        }
    };

    return {
        addSessionForm,
        addSessionLoading: loading,
        addSessionError: error,
        handleAddSessionChange,
        handleOpenAddSession,
        handleAddSessionSubmit,
    };
}
