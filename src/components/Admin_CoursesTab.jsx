import React from "react";
import {
    MdSchool,
    MdSearch,
    MdPerson,
    MdEdit,
    MdDelete,
} from "react-icons/md";

function Admin_CoursesTab({ batchData, setIsAddCourseModalOpen, handleOpenAssignFaculty, handleEditCourseClick }) {
    return (
        <div className="w-full flex-1 max-w-7xl mx-auto py-4">
            {/* Page Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Course Directory</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your institution's curriculum and credit assignments.</p>
                </div>
                <button onClick={() => setIsAddCourseModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20">
                    <MdSchool className="text-[20px]" />
                    Add New Course
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MdSearch className="text-slate-400 group-focus-within:text-blue-600 transition-colors text-[20px]" />
                    </div>
                    <input className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm" placeholder="Search courses by code or name (e.g. CS101, Calculus)..." type="text" />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Course Code</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Course Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Assigned Faculty</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {batchData.courses.length > 0 ? batchData.courses.map((c, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{c.course_code}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{c.course_name}</td>
                                    <td className="px-6 py-4">
                                        {c.assigned_faculty === "Not Assigned" || !c.assigned_faculty ? (
                                            <button onClick={() => handleOpenAssignFaculty(c)} className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                                                Assign Faculty
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                    <MdPerson className="text-[14px]" />
                                                </div>
                                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{c.assigned_faculty}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button onClick={() => handleEditCourseClick(c)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors inline-flex">
                                            <MdEdit className="text-[20px]" />
                                        </button>
                                        <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors inline-flex">
                                            <MdDelete className="text-[20px]" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-slate-400 text-center py-8">No courses found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{batchData.courses.length > 0 ? 1 : 0} to {batchData.courses.length}</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">{batchData.courses.length}</span> entries
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Previous</button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">1</button>
                        <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin_CoursesTab;
