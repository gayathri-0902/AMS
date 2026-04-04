import { useState } from "react";
import axios from "axios";

/**
 * Owns all course-related CRUD state and handlers:
 * adding courses, assigning faculty, and editing courses.
 *
 * @param {object} deps
 * @param {object} deps.batchData          - Current batch from useBatchData
 * @param {Function} deps.refetchBatchData - Re-fetches after a mutation
 * @param {Function} deps.setActiveModal   - Controls which modal is visible
 */
export function useCourseActions({ batchData, refetchBatchData, setActiveModal }) {
    // ── Add Course ─────────────────────────────────────────────────────────────
    const [addCourseForm, setAddCourseForm] = useState({
        course_code: "",
        course_name: "",
        credits: "",
    });
    const [addCourseLoading, setAddCourseLoading] = useState(false);
    const [addCourseError, setAddCourseError] = useState(null);

    const handleAddCourseChange = (e) =>
        setAddCourseForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    /**
     * @param {Event}   e
     * @param {boolean} shouldAssignFaculty - When true, chains into the Assign Faculty modal.
     */
    const handleAddCourseSubmit = async (e, shouldOpenAssignFaculty = false) => {
        e.preventDefault();
        
        setAddCourseLoading(true);
        setAddCourseError(null);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/add-course`,
                addCourseForm
            );
            
            const newOffering = response.data.offering;
            setActiveModal(null);
            setAddCourseForm({ 
                course_code: "", 
                course_name: "", 
                credits: "", 
                yr: "", sem: "", stream: "", academic_yr: "" 
            });
            await refetchBatchData();

            if (shouldOpenAssignFaculty) {
                // Open assign faculty for the newly created offering
                handleOpenAssignFaculty({
                    subject_offering_id: newOffering._id,
                    course_code: addCourseForm.course_code,
                    course_name: addCourseForm.course_name
                });
            }
        } catch (err) {
            setAddCourseError(err.response?.data?.message || err.message || "Failed to add course");
        } finally {
            setAddCourseLoading(false);
        }
    };

    // ── Assign Faculty ─────────────────────────────────────────────────────────
    const [assignFacultyCourseData, setAssignFacultyCourseData] = useState(null);
    const [assignFacultyForm, setAssignFacultyForm] = useState({ email: "" });
    const [assignFacultyLoading, setAssignFacultyLoading] = useState(false);
    const [assignFacultyError, setAssignFacultyError] = useState(null);

    /** Opens the Assign Faculty modal for a specific offering. */
    const handleOpenAssignFaculty = (course) => {
        setAssignFacultyCourseData(course);
        setAssignFacultyForm({ email: "" });
        setAssignFacultyError(null);
        setActiveModal("assignFaculty");
    };

    const handleAssignFacultySubmit = async (e) => {
        e.preventDefault();
        if (!assignFacultyCourseData?.subject_offering_id) return;
        setAssignFacultyLoading(true);
        setAssignFacultyError(null);
        try {
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/change-faculty`,
                {
                    subject_offering_id: assignFacultyCourseData.subject_offering_id,
                    faculty_email: assignFacultyForm.email,
                }
            );
            setActiveModal(null);
            setAssignFacultyForm({ email: "" });
            setAssignFacultyCourseData(null);
            await refetchBatchData();
        } catch (err) {
            setAssignFacultyError(
                err.response?.data?.message || err.message || "Failed to assign faculty"
            );
        } finally {
            setAssignFacultyLoading(false);
        }
    };

    // ── Edit Course ────────────────────────────────────────────────────────────
    const [editCourseForm, setEditCourseForm] = useState({
        subject_offering_id: "",
        course_code: "",
        course_name: "",
        credits: "3",
        assigned_faculty: "",
        assigned_faculty_email: "",
        new_faculty_email: "", // Separated for better UX
    });
    const [editCourseTab, setEditCourseTab] = useState("general");
    const [editCourseLoading, setEditCourseLoading] = useState(false);
    const [editCourseError, setEditCourseError] = useState(null);

    /** Populates the edit form from the selected course row and opens the modal. */
    const handleEditCourseClick = (course) => {
        setEditCourseForm({
            subject_offering_id: course.subject_offering_id || "",
            course_code: course.course_code || "",
            course_name: course.course_name || "",
            credits: course.credits || "3",
            assigned_faculty: course.assigned_faculty || "Not Assigned",
            assigned_faculty_email: course.assigned_faculty_email || "",
            new_faculty_email: "", // Initialize as empty for input
        });
        setEditCourseTab("general");
        setEditCourseError(null);
        setActiveModal("editCourse");
    };

    const handleEditCourseChange = (e) =>
        setEditCourseForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleEditCourseSubmit = async (e) => {
        e?.preventDefault();
        if (!editCourseForm.subject_offering_id) return;

        setEditCourseLoading(true);
        setEditCourseError(null);
        try {
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/edit-course/${editCourseForm.subject_offering_id}`,
                {
                    course_code: editCourseForm.course_code,
                    course_name: editCourseForm.course_name,
                    credits: editCourseForm.credits,
                    assigned_faculty_email: editCourseForm.new_faculty_email || editCourseForm.assigned_faculty_email,
                }
            );
            setActiveModal(null);
            await refetchBatchData();
        } catch (err) {
            setEditCourseError(err.response?.data?.message || err.message || "Failed to update course");
        } finally {
            setEditCourseLoading(false);
        }
    };

    const handleRemoveFaculty = async () => {
        if (!editCourseForm.subject_offering_id) return;

        setEditCourseLoading(true);
        setEditCourseError(null);
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/remove-faculty/${editCourseForm.subject_offering_id}`
            );
            
            // Update local state to reflect removal immediately
            setEditCourseForm(prev => ({
                ...prev,
                assigned_faculty: "Not Assigned",
                assigned_faculty_email: ""
            }));

            await refetchBatchData();
        } catch (err) {
            setEditCourseError(err.response?.data?.message || err.message || "Failed to remove faculty");
        } finally {
            setEditCourseLoading(false);
        }
    };

    return {
        // Add Course
        addCourseForm,
        addCourseLoading,
        addCourseError,
        handleAddCourseChange,
        handleAddCourseSubmit,
        // Assign Faculty
        assignFacultyCourseData,
        assignFacultyForm,
        setAssignFacultyForm,
        assignFacultyLoading,
        assignFacultyError,
        handleOpenAssignFaculty,
        handleAssignFacultySubmit,
        // Edit Course
        editCourseForm,
        editCourseTab,
        setEditCourseTab,
        editCourseLoading,
        editCourseError,
        handleEditCourseClick,
        handleEditCourseChange,
        handleEditCourseSubmit,
        handleRemoveFaculty,
    };
}
