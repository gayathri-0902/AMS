import { useState } from "react";
import axios from "axios";

/**
 * Owns all student CRUD state and handlers.
 * Calls `setActiveModal` directly so the modal-open decision lives here,
 * not in the parent component.
 *
 * @param {object} deps
 * @param {object} deps.batchData        - Current batch from useBatchData
 * @param {object} deps.formData         - Batch form values (needs academic_yr for add)
 * @param {Function} deps.refetchBatchData - Re-fetches after a mutation
 * @param {Function} deps.setActiveModal   - Controls which modal is visible
 */
export function useStudentActions({ batchData, formData, refetchBatchData, setActiveModal }) {
    // ── Add Student ────────────────────────────────────────────────────────────
    const [addStudentForm, setAddStudentForm] = useState({
        name: "",
        roll_no: "",
        email: "",
        password: "",
        status: "active",
    });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState(null);


    /*What it does: Every time the admin types a letter in an input field, this function runs.

    How it works: It looks at the name of the input field (like "email") and updates only that specific part of the form while keeping everything else exactly as it was.
    */
    const handleAddStudentChange = (e) =>
        setAddStudentForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));


    const handleAddStudentSubmit = async (e) => {
        e.preventDefault();
        if (!batchData?.yr_sem_id) return;
        setAddLoading(true);
        setAddError(null);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/add-student`,
                { ...addStudentForm, yr_sem_id: batchData.yr_sem_id, academic_yr: formData.academic_yr }
            );
            setActiveModal(null);
            setAddStudentForm({ name: "", roll_no: "", email: "", password: "", status: "active" });
            await refetchBatchData();
        } catch (err) {
            setAddError(err.response?.data?.message || err.message || "Failed to add student");
        } finally {
            setAddLoading(false);
        }
    };

    // ── Edit Student ───────────────────────────────────────────────────────────
    const [editStudentForm, setEditStudentForm] = useState({
        _id: "",
        name: "",
        roll_no: "",
        email: "",
        password: "",
        status: "active",
    });
    const [editStudentOriginal, setEditStudentOriginal] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    /** Populates the edit form from the selected row and opens the modal. */
    const handleEditStudentClick = (student) => {
        const form = {
            _id: student._id,
            name: student.name,
            roll_no: student.roll_no,
            email: student.email,
            password: "",
            status: student.status || "active",
        };
        setEditStudentForm(form);
        setEditStudentOriginal({ ...form });
        setEditError(null);
        setActiveModal("editStudent");
    };

    const handleEditStudentChange = (e) =>
        setEditStudentForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleEditStudentSubmit = async (e) => {
        e.preventDefault();
        const hasChanges =
            (editStudentOriginal && (
                editStudentForm.name !== editStudentOriginal.name ||
                editStudentForm.roll_no !== editStudentOriginal.roll_no ||
                editStudentForm.email !== editStudentOriginal.email ||
                editStudentForm.status !== editStudentOriginal.status ||
                editStudentForm.password !== ""
            ));

        if (!hasChanges) {
            setEditError("Please make any changes first.");
            return;
        }
        setEditLoading(true);
        setEditError(null);
        try {
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/edit-student/${editStudentForm._id}`,
                editStudentForm
            );
            setActiveModal(null);
            await refetchBatchData();
        } catch (err) {
            setEditError(err.response?.data?.message || err.message || "Failed to update student");
        } finally {
            setEditLoading(false);
        }
    };

    // ── Bulk Selection & Promotion ─────────────────────────────────────────────
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [promoteLoading, setPromoteLoading] = useState(false);
    const [promoteError, setPromoteError] = useState(null);

    const handleToggleStudentSelection = (id) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (students) => {
        if (selectedStudentIds.length === (students?.length || 0) && (students?.length || 0) > 0) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(students?.map((s) => s._id) || []);
        }
    };

    const handlePromoteSubmit = async (targetYrSem) => {
        if (!selectedStudentIds.length) return;
        setPromoteLoading(true);
        setPromoteError(null);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/promote-students`,
                { studentIds: selectedStudentIds, targetYrSem }
            );
            setSelectedStudentIds([]);
            setActiveModal(null);
            await refetchBatchData();
        } catch (err) {
            setPromoteError(err.response?.data?.message || err.message || "Failed to promote students");
        } finally {
            setPromoteLoading(false);
        }
    };

    return {
        // Add
        addStudentForm,
        addLoading,
        addError,
        handleAddStudentChange,
        handleAddStudentSubmit,
        // Edit
        editStudentForm,
        editLoading,
        editError,
        handleEditStudentClick,
        handleEditStudentChange,
        handleEditStudentSubmit,
        // Selection/Promote
        selectedStudentIds,
        promoteLoading,
        promoteError,
        handleToggleStudentSelection,
        handleSelectAll,
        handlePromoteSubmit,
    };
}
