import React from "react";
import { MdClose } from "react-icons/md";

function Admin_ModalEditCourse({ isOpen, onClose, form, onChange, onSubmit, onRemoveFaculty, loading, error, tab, setTab }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Edit Course</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <MdClose size={24} />
                    </button>
                </header>

                {/* Tabs */}
                <nav className="flex border-b border-slate-200 px-6">
                    <button
                        onClick={() => setTab("general")}
                        className={`py-4 px-4 border-b-2 text-sm font-medium transition-all ${tab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        General Info
                    </button>
                    <button
                        onClick={() => setTab("faculty")}
                        className={`py-4 px-4 border-b-2 text-sm font-medium transition-all ${tab === "faculty" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Faculty Assignment
                    </button>
                </nav>

                {/* Content */}
                <main className="flex-1 overflow-y-auto no-scrollbar p-6">

                    {/* GENERAL TAB */}
                    {tab === "general" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Course Code</label>
                                    <input
                                        name="course_code"
                                        value={form.course_code}
                                        onChange={onChange}
                                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Credits</label>
                                    <select
                                        name="credits"
                                        value={form.credits}
                                        onChange={onChange}
                                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                    >
                                        <option value="1">1 Credit</option>
                                        <option value="2">2 Credits</option>
                                        <option value="3">3 Credits</option>
                                        <option value="4">4 Credits</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Course Name</label>
                                    <input
                                        name="course_name"
                                        value={form.course_name}
                                        onChange={onChange}
                                        className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FACULTY TAB */}
                    {tab === "faculty" && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Current Faculty</h3>

                            <div className="flex items-center justify-between p-4 bg-slate-100 rounded-md">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                        {form.assigned_faculty ? form.assigned_faculty[0] : "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{form.assigned_faculty || "Not Assigned"}</p>
                                        <p className="text-xs text-slate-500">{form.assigned_faculty_email}</p>
                                    </div>
                                </div>
                                {form.assigned_faculty !== "Not Assigned" && form.assigned_faculty && (
                                    <button
                                        onClick={onRemoveFaculty}
                                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                                    >
                                        Remove Assignment
                                    </button>
                                )}
                            </div>

                            {/* Faculty Assignment / Update */}
                            <div className="pt-4 border-t border-slate-200">
                                <label className="block text-sm font-medium mb-2">Change or Assign New Faculty (Email)</label>
                                <input
                                    name="new_faculty_email"
                                    value={form.new_faculty_email}
                                    onChange={onChange}
                                    type="email"
                                    placeholder="Enter faculty email..."
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-1">Provide the exact email address of the faculty member.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
                            {error}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-md">
                        Cancel
                    </button>
                    <button onClick={onSubmit} disabled={loading} className="px-6 py-2 text-sm text-white bg-blue-600 rounded-md flex items-center gap-2">
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Save Changes'}
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default Admin_ModalEditCourse;
