import React from "react";
import { MdClose, MdTag, MdBook, MdStar, MdExpandMore, MdPersonAdd } from "react-icons/md";

function Admin_ModalAddCourse({ isOpen, onClose, form, onChange, onSubmit, loading, error }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">

                {/* Modal Header */}
                <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Add New Course</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fill in the details to register the course.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <MdClose className="text-[24px]" />
                    </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={(e) => onSubmit(e, false)}>
                    <div className="p-6 space-y-5">
                        {/* Course Code */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Course Code</label>
                            <div className="relative">
                                <MdTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]" />
                                <input name="course_code" value={form.course_code} onChange={onChange} required className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400" placeholder="e.g. CS101" type="text" />
                            </div>
                        </div>

                        {/* Course Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Course Name</label>
                            <div className="relative">
                                <MdBook className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]" />
                                <input name="course_name" value={form.course_name} onChange={onChange} required className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400" placeholder="e.g. Introduction to Algorithms" type="text" />
                            </div>
                        </div>

                        {/* Credits */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Credits</label>
                            <div className="relative">
                                <MdStar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]" />
                                <select name="credits" value={form.credits} onChange={onChange} required className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none text-slate-900 dark:text-slate-100 appearance-none">
                                    <option value="" disabled>Select credits</option>
                                    <option value="1">1 Credit</option>
                                    <option value="2">2 Credits</option>
                                    <option value="3">3 Credits</option>
                                    <option value="4">4 Credits</option>
                                </select>
                                <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]" />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/30 flex flex-col gap-3">
                        <button type="button" onClick={(e) => onSubmit(e, true)} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                                <>
                                    <MdPersonAdd className="text-[20px]" />
                                    Assign Faculty
                                </>
                            )}
                        </button>
                        <button type="submit" disabled={loading} className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold py-3 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                            Not Now / Skip
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Admin_ModalAddCourse;
