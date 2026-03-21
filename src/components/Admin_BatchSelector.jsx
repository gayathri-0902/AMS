import React from "react";
import {
    MdLayers,
    MdArrowForward,
    MdInfoOutline,
} from "react-icons/md";

function Admin_BatchSelector({ formData, handleChange, handleFetch, loading, error }) {
    return (
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

            {/* Form Card */}
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

                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 text-sm">
                        <span className="font-semibold">Error:</span> {error}
                    </div>
                )}
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
    );
}

export default Admin_BatchSelector;
