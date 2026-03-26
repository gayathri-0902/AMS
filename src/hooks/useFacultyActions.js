import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Manages faculty CRUD state and handlers.
 *
 * @param {object} deps
 * @param {Function} deps.setActiveModal   - Controls which modal is visible
 * @param {Function} deps.refetchBatchData - Re-fetches current batch data (if needed)
 */
export function useFacultyActions({ setActiveModal, refetchBatchData }) {
    const [faculties, setFaculties] = useState([]);
    const [loadingFaculties, setLoadingFaculties] = useState(false);
    const [facultiesError, setFacultiesError] = useState(null);

    // ── Add Faculty ────────────────────────────────────────────────────────────
    const [addFacultyForm, setAddFacultyForm] = useState({
        name: "",
        email: "",
        user_name: "",
        password: "",
    });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState(null);

    const handleAddFacultyChange = (e) =>
        setAddFacultyForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAddFacultySubmit = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        setAddError(null);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/add-faculty`,
                addFacultyForm
            );
            setActiveModal(null);
            setAddFacultyForm({ name: "", email: "", user_name: "", password: "" });
            await fetchAllFaculties();
            if (refetchBatchData) await refetchBatchData();
        } catch (err) {
            setAddError(err.response?.data?.message || err.message || "Failed to add faculty");
        } finally {
            setAddLoading(false);
        }
    };

    // ── Edit Faculty ───────────────────────────────────────────────────────────
    const [editFacultyForm, setEditFacultyForm] = useState({
        _id: "",
        name: "",
        email: "",
        user_name: "",
        password: "",
    });
    const [editFacultyOriginal, setEditFacultyOriginal] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    const handleEditFacultyClick = (faculty) => {
        const form = {
            _id: faculty._id,
            name: faculty.name,
            email: faculty.email,
            user_name: faculty.user_name || "",
            password: "", // Always start empty for security
        };
        setEditFacultyForm(form);
        setEditFacultyOriginal({ ...form });
        setEditError(null);
        setActiveModal("editFaculty");
    };

    const handleEditFacultyChange = (e) =>
        setEditFacultyForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleEditFacultySubmit = async (e) => {
        e.preventDefault();
        const hasChanges =
            (editFacultyOriginal && (
                editFacultyForm.name !== editFacultyOriginal.name ||
                editFacultyForm.email !== editFacultyOriginal.email ||
                editFacultyForm.user_name !== editFacultyOriginal.user_name ||
                editFacultyForm.password !== ""
            ));

        if (!hasChanges) {
            setEditError("Please make any changes first.");
            return;
        }

        setEditLoading(true);
        setEditError(null);
        try {
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/edit-faculty/${editFacultyForm._id}`,
                editFacultyForm
            );
            setActiveModal(null);
            await fetchAllFaculties();
            if (refetchBatchData) await refetchBatchData();
        } catch (err) {
            setEditError(err.response?.data?.message || err.message || "Failed to update faculty");
        } finally {
            setEditLoading(false);
        }
    };

    // ── Fetching Data ──────────────────────────────────────────────────────────
    const fetchAllFaculties = async () => {
        setLoadingFaculties(true);
        setFacultiesError(null);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/faculties`);
            setFaculties(response.data);
        } catch (err) {
            setFacultiesError("Failed to load faculty directory");
        } finally {
            setLoadingFaculties(false);
        }
    };

    useEffect(() => {
        fetchAllFaculties();
    }, []);

    return {
        faculties,
        loadingFaculties,
        facultiesError,
        fetchAllFaculties,
        // Add
        addFacultyForm,
        addLoading,
        addError,
        handleAddFacultyChange,
        handleAddFacultySubmit,
        // Edit
        editFacultyForm,
        editLoading,
        editError,
        handleEditFacultyClick,
        handleEditFacultyChange,
        handleEditFacultySubmit,
    };
}
