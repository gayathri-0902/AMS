import React from "react";
import { MdPersonAdd, MdEmail } from "react-icons/md";

function Admin_ModalAssignFaculty({ isOpen, onClose, courseData, form, onChange, onSubmit, loading, error }) {
    if (!isOpen || !courseData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">

                {/* Modal Header */}
                <div className="p-6 md:p-8 flex flex-col gap-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
                            <MdPersonAdd className="text-[24px]" />
                        </div>
                        <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight">Assign Faculty</h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed">
                        Link an educator to <span className="font-semibold text-slate-700 dark:text-slate-200 underline decoration-blue-500/30">{courseData.course_name}</span> by entering their email address.
                    </p>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={onSubmit}>
                    <div className="px-6 md:px-8 pb-4 space-y-6">
                        
                        {/* Course Display (Read Only) */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Course</span>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[10px] uppercase">{courseData?.course_code || "---"}</span>
                                {courseData?.course_name || "Course Selection"}
                            </div>
                        </div>

                        {/* Faculty Email */}
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-tight">Faculty Email Address</span>
                            <div className="relative flex items-center">
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={(e) => onChange({ ...form, email: e.target.value })}
                                    required
                                    className="w-full h-12 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder="professor@university.edu"
                                    type="email"
                                />
                                <div className="absolute right-4 text-slate-400">
                                    <MdEmail className="text-[20px]" />
                                </div>
                            </div>
                        </label>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-bold flex flex-col gap-1">
                                <span className="uppercase text-[10px] opacity-70">Assignment Error</span>
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 md:p-8 flex flex-col gap-3">
                        <button type="submit" disabled={loading} className="flex w-full h-12 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-bold tracking-wide transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Register Assignment'}
                        </button>
                        <button type="button" onClick={onClose} disabled={loading} className="flex w-full h-12 items-center justify-center rounded-xl bg-transparent text-slate-500 dark:text-slate-400 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            Cancel
                        </button>
                    </div>
                </form>

                {/* Progress/Status Bar */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-blue-600 w-1/3"></div>
                </div>
            </div>
        </div>
    );
}

export default Admin_ModalAssignFaculty;
