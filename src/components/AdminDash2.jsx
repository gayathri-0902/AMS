import React, { useState } from "react";
import {
    MdPeople,
    MdPerson,
    MdMenuBook,
    MdCalendarToday,
    MdArrowForward,
    MdLayers,
    MdCalendarMonth,
    MdImportContacts,
    MdAccountTree,
    MdInfoOutline,
    MdLogout,
    MdPublishedWithChanges,
    MdSchool,
    MdBook,
    MdFileDownload,
    MdPersonAdd,
    MdSearch,
    MdEdit,
    MdDelete,
    MdClose
} from "react-icons/md";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function AdminDash2() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // Batch Fetching State
    const [formData, setFormData] = useState({
        yr: "",
        sem: "",
        stream: "",
        academic_yr: ""
    });

    const [batchData, setBatchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("Change Batch");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFetch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setBatchData(null);

        try {
            const { yr, sem, stream, academic_yr } = formData;
            if (!yr || !sem || !stream || !academic_yr) {
                throw new Error("Please fill in all fields");
            }
            
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/batch-data`, {
                params: { yr, sem, stream, academic_yr }
            });

            setBatchData(response.data);
            setActiveTab("Students"); // Switch view automatically
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    // Add Student State & Handlers
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addStudentForm, setAddStudentForm] = useState({
        name: "",
        roll_no: "",
        email: "",
        password: "",
        status: "active"
    });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState(null);

    const handleAddStudentChange = (e) => {
        setAddStudentForm({ ...addStudentForm, [e.target.name]: e.target.value });
    };

    const handleAddStudentSubmit = async (e) => {
        e.preventDefault();
        if (!batchData || !batchData.yr_sem_id) return;
        
        setAddLoading(true);
        setAddError(null);

        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/add-student`, {
                ...addStudentForm,
                yr_sem_id: batchData.yr_sem_id,
                academic_yr: formData.academic_yr
            });

            setIsAddModalOpen(false);
            setAddStudentForm({ name: "", roll_no: "", email: "", password: "", status: "active" });
            
            // Refetch the data perfectly to update the table
            const { yr, sem, stream, academic_yr } = formData;
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/batch-data`, {
                params: { yr, sem, stream, academic_yr }
            });
            setBatchData(response.data);

        } catch (err) {
            setAddError(err.response?.data?.message || err.message || "Failed to add student");
        } finally {
            setAddLoading(false);
        }
    };

    // Edit Student State & Handlers
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editStudentForm, setEditStudentForm] = useState({
        _id: "",
        name: "",
        roll_no: "",
        email: "",
        password: "",
        status: "active"
    });
    const [editStudentOriginal, setEditStudentOriginal] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    const handleEditStudentClick = (student) => {
        const formData = {
            _id: student._id,
            name: student.name,
            roll_no: student.roll_no,
            email: student.email,
            password: "", // User will only type here if they want to override the password
            status: student.status || "active"
        };
        setEditStudentForm(formData);
        // We compare fields that the user originally had (ignoring password since it's empty unless typed)
        setEditStudentOriginal({ ...formData });
        setIsEditModalOpen(true);
        setEditError(null);
    };

    const handleEditStudentChange = (e) => {
        setEditStudentForm({ ...editStudentForm, [e.target.name]: e.target.value });
    };

    const handleEditStudentSubmit = async (e) => {
        e.preventDefault();
        
        // Check if anything actually changed
        const hasChanges = 
            editStudentForm.name !== editStudentOriginal.name ||
            editStudentForm.roll_no !== editStudentOriginal.roll_no ||
            editStudentForm.email !== editStudentOriginal.email ||
            editStudentForm.status !== editStudentOriginal.status ||
            editStudentForm.password !== ""; // Setting a new password counts as a change

        if (!hasChanges) {
            setEditError("Please make any changes first.");
            return;
        }

        setEditLoading(true);
        setEditError(null);

        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/edit-student/${editStudentForm._id}`, editStudentForm);

            setIsEditModalOpen(false);
            
            // Refetch the data perfectly to update the table
            const { yr, sem, stream, academic_yr } = formData;
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/batch-data`, {
                params: { yr, sem, stream, academic_yr }
            });
            setBatchData(response.data);

        } catch (err) {
            setEditError(err.response?.data?.message || err.message || "Failed to update student");
        } finally {
            setEditLoading(false);
        }
    };

    const isBatchSelected = batchData !== null;

    const navLinkClass = (tabName) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer
        ${activeTab === tabName
            ? 'bg-blue-600/10 text-blue-600'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
        ${!isBatchSelected && tabName !== "Change Batch" ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}
    `;

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <div className="flex h-screen overflow-hidden">

                {/* Sidebar */}
                <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">

                        <div className="py-2">
                            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Configuration
                            </p>

                            <a onClick={() => setActiveTab("Change Batch")} className={navLinkClass("Change Batch")}>
                                <MdPublishedWithChanges className="text-[22px]" />
                                <span className="text-sm font-medium">Change Batch</span>
                            </a>
                        </div>

                        <div className="py-2">
                            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Menu
                            </p>

                            <a onClick={() => isBatchSelected && setActiveTab("Students")} className={navLinkClass("Students")}>
                                <MdPeople className="text-[22px]" />
                                <span className="text-sm font-medium">Students</span>
                            </a>

                            <a onClick={() => isBatchSelected && setActiveTab("Faculties")} className={navLinkClass("Faculties")}>
                                <MdPerson className="text-[22px]" />
                                <span className="text-sm font-medium">Faculties</span>
                            </a>

                            <a onClick={() => isBatchSelected && setActiveTab("Courses")} className={navLinkClass("Courses")}>
                                <MdMenuBook className="text-[22px]" />
                                <span className="text-sm font-medium">Courses</span>
                            </a>

                            <a onClick={() => isBatchSelected && setActiveTab("Schedule")} className={navLinkClass("Schedule")}>
                                <MdCalendarToday className="text-[22px]" />
                                <span className="text-sm font-medium">Schedule</span>
                            </a>
                        </div>

                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative">

                    {/* Header */}
                    <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={logout}
                                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 text-slate-500 transition-colors"
                                title="Logout"
                            >
                                <MdLogout className="text-[24px]" />
                            </button>
                            <h1 className="text-xl font-semibold">{activeTab}</h1>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="max-w-6xl mx-auto py-12 px-8 flex flex-col items-center">

                        {!isBatchSelected && (
                            <div className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-8 flex items-center gap-3">
                                <MdInfoOutline className="text-[24px]" />
                                <p className="font-medium">Please select an academic batch configuration to unlock the menu and view information.</p>
                            </div>
                        )}

                        {activeTab === "Change Batch" && (
                            <>
                                <div className="text-center mb-10 mt-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 mb-4">
                                        <MdLayers className="text-[32px]" />
                                    </div>

                                    <h2 className="text-3xl font-bold mb-3">
                                        Select Academic Batch
                                    </h2>

                                    <p className="text-slate-500 max-w-md mx-auto">
                                        Please select the appropriate academic details to switch your portal view.
                                    </p>
                                </div>

                                {/* Form Card from AddData */}
                                <div className="w-full max-w-6xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-8">

                                    <form onSubmit={handleFetch} className="flex flex-col md:flex-row gap-4 items-end justify-center">
                                        <div className="w-full md:w-1/4">
                                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Year</label>
                                            <select name="yr" value={formData.yr} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 rounded-xl text-[#2b2b2b] dark:text-white text-[16px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" required>
                                                <option value="" disabled>Select Year</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                            </select>
                                        </div>
                                        <div className="w-full md:w-1/4">
                                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Semester</label>
                                            <select name="sem" value={formData.sem} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 rounded-xl text-[#2b2b2b] dark:text-white text-[16px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" required>
                                                <option value="" disabled>Select Sem</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                            </select>
                                        </div>
                                        <div className="w-full md:w-1/4">
                                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Stream</label>
                                            <input type="text" name="stream" placeholder="e.g. CSE" value={formData.stream} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 rounded-xl text-[#2b2b2b] dark:text-white text-[16px] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" required />
                                        </div>
                                        <div className="w-full md:w-1/4">
                                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Academic Year</label>
                                            <input type="text" name="academic_yr" placeholder="e.g. 2021-25" value={formData.academic_yr} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 rounded-xl text-[#2b2b2b] dark:text-white text-[16px] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" required />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap h-[50px]"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <MdArrowForward className="text-[18px]" />
                                                    Fetch Batch Data
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 text-sm"><span className="font-semibold">Error:</span> {error}</div>}
                                </div>

                                {/* Info Alert */}
                                <div className="mt-8 flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 max-w-xl">
                                    <MdInfoOutline className="text-blue-600 text-[24px] shrink-0" />

                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Changing the batch will refresh the entire portal content including
                                        student lists, faculty assignments, and active courses.
                                    </p>
                                </div>
                            </>
                        )}

                        {activeTab === "Students" && isBatchSelected && (
                            <div className="w-full flex-1 max-w-7xl mx-auto py-4">
                                {/* Page Header Section */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Directory</h1>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and monitor all {batchData.students.length} registered students in this batch.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                            <MdFileDownload className="text-[20px]" />
                                            Export Data
                                        </button>
                                        <button 
                                            onClick={() => setIsAddModalOpen(true)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                                        >
                                            <MdPersonAdd className="text-[20px]" />
                                            Add New Student
                                        </button>
                                    </div>
                                </div>

                                {/* Content Container */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    {/* Filter Bar */}
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]" />
                                                <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all" placeholder="Search by name, ID or email..." type="text" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table Content */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name & Identity</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {batchData.students.length > 0 ? batchData.students.map((s, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                                                                    {s.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">ID: {s.roll_no} • {formData.stream.toUpperCase()} Student</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : s.status === 'inactive' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                                                {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => handleEditStudentClick(s)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                                                                    <MdEdit className="text-[20px]" />
                                                                </button>
                                                                <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                                                    <MdDelete className="text-[20px]" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="4" className="text-slate-400 text-center py-8">No students enrolled in this batch</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            Showing <span className="font-semibold text-slate-900 dark:text-slate-100">1 to {batchData.students.length}</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">{batchData.students.length}</span> students
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                                Previous
                                            </button>
                                            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                                1
                                            </button>
                                            <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "Courses" && isBatchSelected && (
                            <div className="w-full">
                                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 flex flex-col w-full max-w-4xl mx-auto">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><MdBook size={24} /></div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800">Assigned Courses</h3>
                                            <p className="text-slate-500">{batchData.courses.length} courses active in this batch.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {batchData.courses.length > 0 ? batchData.courses.map((c, i) => (
                                            <div key={i} className="p-5 border border-slate-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/50 transition">
                                                <div className="font-bold text-slate-800 text-lg">{c.course_name}</div>
                                                <div className="text-sm font-semibold text-slate-500 my-2">{c.course_code}</div>
                                                <div className="text-sm px-3 py-1.5 bg-slate-50 rounded-lg inline-block border border-slate-100">
                                                    Faculty: <span className="font-medium text-slate-700">{c.assigned_faculty}</span>
                                                </div>
                                            </div>
                                        )) : <p className="text-slate-400 text-center py-8 col-span-2">No courses found</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "Faculties" && isBatchSelected && (
                            <div className="w-full">
                                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 flex flex-col w-full max-w-4xl mx-auto">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><MdPerson size={24} /></div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800">Assigned Faculty Directory</h3>
                                            <p className="text-slate-500">{batchData.faculties.length} instructors teaching this batch.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {batchData.faculties.length > 0 ? batchData.faculties.map((f, i) => (
                                            <div key={i} className="p-5 border border-slate-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/50 transition flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xl shrink-0">
                                                    {f.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-lg">{f.name}</div>
                                                    <div className="text-sm text-slate-500">{f.email}</div>
                                                </div>
                                            </div>
                                        )) : <p className="text-slate-400 text-center py-8 col-span-2">No faculties assigned</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "Schedule" && isBatchSelected && (
                            <div className="w-full text-center py-20 bg-white rounded-3xl border border-slate-100 max-w-4xl mx-auto">
                                <MdCalendarToday className="mx-auto text-6xl text-slate-200 mb-4" />
                                <h3 className="text-xl font-bold text-slate-800">Schedule View Comming Soon</h3>
                                <p className="text-slate-500 mt-2">The timetable visualizer is currently under construction.</p>
                            </div>
                        )}

                    </div>

                </main>

                {/* Add Student Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add New Student</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <MdClose className="text-[24px]" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
                                    <input type="text" name="name" value={addStudentForm.name} onChange={handleAddStudentChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. John Doe" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Roll Number / ID</label>
                                    <input type="text" name="roll_no" value={addStudentForm.roll_no} onChange={handleAddStudentChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. 21CSE001" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email Address</label>
                                    <input type="email" name="email" value={addStudentForm.email} onChange={handleAddStudentChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. john@univ.edu" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Temporary Password</label>
                                    <input type="text" name="password" value={addStudentForm.password} onChange={handleAddStudentChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. Pass@123" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Enrollment Status</label>
                                    <select name="status" value={addStudentForm.status} onChange={handleAddStudentChange} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="graduated">Graduated</option>
                                    </select>
                                </div>

                                {addError && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
                                        {addError}
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={addLoading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center">
                                        {addLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Save Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Student Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit Student</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <MdClose className="text-[24px]" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleEditStudentSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
                                    <input type="text" name="name" value={editStudentForm.name} onChange={handleEditStudentChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. John Doe" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Roll Number / ID</label>
                                    <input type="text" name="roll_no" value={editStudentForm.roll_no} onChange={handleEditStudentChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. 21CSE001" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email Address</label>
                                    <input type="email" name="email" value={editStudentForm.email} onChange={handleEditStudentChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. john@univ.edu" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Reset Password <span className="text-xs font-normal text-slate-400">(Leave blank to keep current)</span></label>
                                    <input type="text" name="password" value={editStudentForm.password} onChange={handleEditStudentChange} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="Enter new password to override..." />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Enrollment Status</label>
                                    <select name="status" value={editStudentForm.status} onChange={handleEditStudentChange} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="graduated">Graduated</option>
                                    </select>
                                </div>

                                {editError && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
                                        {editError}
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editLoading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center">
                                        {editLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Update Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default AdminDash2;