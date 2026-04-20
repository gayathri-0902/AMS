import React from "react";
import { MdClose } from "react-icons/md";

function Admin_ModalEditCourse({ isOpen, onClose, form, onChange, onSubmit, onRemoveFaculty, loading, error, tab, setTab }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Edit Course</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Modify course specifications and faculty metrics.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <MdClose size={24} />
                    </button>
                </header>

                {/* Tabs */}
                <nav className="flex border-b border-slate-100 dark:border-slate-800 px-8 bg-white dark:bg-slate-900">
                    <button
                        onClick={() => setTab("general")}
                        className={`py-4 px-6 border-b-2 text-xs font-black uppercase tracking-widest transition-all ${tab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                    >
                        General Info
                    </button>
                    <button
                        onClick={() => setTab("faculty")}
                        className={`py-4 px-6 border-b-2 text-xs font-black uppercase tracking-widest transition-all ${tab === "faculty" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
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
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Course Code</label>
                                    <input
                                        name="course_code"
                                        value={form.course_code}
                                        onChange={onChange}
                                        placeholder="e.g. CS101"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Credits</label>
                                    <select
                                        name="credits"
                                        value={form.credits}
                                        onChange={onChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="1">1 Credit</option>
                                        <option value="2">2 Credits</option>
                                        <option value="3">3 Credits</option>
                                        <option value="4">4 Credits</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Course Name</label>
                                    <input
                                        name="course_name"
                                        value={form.course_name}
                                        onChange={onChange}
                                        placeholder="e.g. Introduction to Neural Networks"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FACULTY TAB */}
                    {tab === "faculty" && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Current Faculty</h3>

                            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-600/20">
                                        {form.assigned_faculty ? form.assigned_faculty[0] : "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{form.assigned_faculty || "Not Assigned"}</p>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{form.assigned_faculty_email}</p>
                                    </div>
                                </div>
                                {form.assigned_faculty !== "Not Assigned" && form.assigned_faculty && (
                                    <button
                                        onClick={onRemoveFaculty}
                                        className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-white bg-red-50 dark:bg-red-900/10 hover:bg-red-600 dark:hover:bg-red-600 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/30 transition-all active:scale-95"
                                    >
                                        Revoke Assignment
                                    </button>
                                )}
                            </div>

                            {/* Faculty Assignment / Update */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pl-1">Assign New Faculty</label>
                                <input
                                    name="new_faculty_email"
                                    value={form.new_faculty_email}
                                    onChange={onChange}
                                    type="email"
                                    placeholder="Enter verified faculty email address..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                                />
                                <p className="text-[10px] font-medium text-slate-400 mt-2 px-1 italic">Note: The faculty member must already have an active profile in the directory.</p>
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
                <footer className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                        Discard
                    </button>
                    <button 
                        onClick={onSubmit} 
                        disabled={loading} 
                        className="px-8 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Update Specification'}
                    </button>
                </footer>
                
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-400/5 rounded-full blur-3xl -z-10"></div>
            </div>
        </div>
    );
}

export default Admin_ModalEditCourse;
