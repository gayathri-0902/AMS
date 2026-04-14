import React from "react";
import {
    MdSchool,
    MdSearch,
    MdPerson,
    MdEdit,
    MdDelete,
} from "react-icons/md";
import Admin_FilterBar from "./Admin_FilterBar";

function Admin_CoursesTab({
    batchData,
    formData,
    searchTerm,
    setIsAddCourseModalOpen,
    handleOpenAssignFaculty,
    handleEditCourseClick,
    handleChange,
    handleFetch,
    clearFilters,
    loading
}) {
    // Local filter based on searchTerm
    const filteredCourses = (batchData?.courses || []).filter(c =>
        (c.course_name || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
        (c.course_code || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
        (c.assigned_faculty && c.assigned_faculty.toLowerCase().includes((searchTerm || "").toLowerCase())) ||
        (c.batch && c.batch.toLowerCase().includes((searchTerm || "").toLowerCase()))
    );

    const isFiltered = !!batchData?.isFiltered;

    return (
        <div className="w-full flex-1 max-w-7xl mx-auto py-4 animate-in fade-in duration-500">

            <Admin_FilterBar
                formData={formData}
                handleChange={handleChange}
                handleFetch={handleFetch}
                clearFilters={clearFilters}
                loading={loading}
            />

            {/* Page Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                        {isFiltered ? "Batch Curriculum" : "Institutional Course Directory"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
                        {isFiltered
                            ? `Course offerings and faculty assignments for the selected batch.`
                            : `Full repository of all academic courses and elective offerings.`}
                    </p>
                </div>
                <button
                    onClick={() => setIsAddCourseModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20"
                >
                    <MdSchool className="text-xl" />
                    Register New Course
                </button>
            </div>

            {/* Data Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none h-full flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Course Code</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Curriculum Name</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target Batch</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assigned Faculty</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredCourses.length > 0 ? filteredCourses.map((c, i) => (
                                <tr key={i} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all">
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 tracking-widest group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                                            {c.course_code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                            {c.course_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-[11px] font-bold px-3 py-1 bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg inline-block border border-blue-200/50 dark:border-blue-800/50">
                                            {c.batch}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {c.assigned_faculty === "Not Assigned" || !c.assigned_faculty ? (
                                            <button
                                                onClick={() => handleOpenAssignFaculty(c)}
                                                className="inline-flex items-center px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10 active:scale-[0.98]"
                                            >
                                                Assign Faculty
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3">

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-900 dark:text-slate-100 font-bold uppercase tracking-tight">{c.assigned_faculty}</span>

                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditCourseClick(c)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Edit Course">
                                                <MdEdit className="text-[20px]" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Remove Record">
                                                <MdDelete className="text-[20px]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 bg-slate-50/30 dark:bg-slate-800/10 text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <MdSearch className="text-5xl opacity-20" />
                                            <p className="font-bold uppercase tracking-widest text-slate-300">No Courses Found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Section */}
                <div className="mt-auto px-8 py-5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Total Course Offerings: <span className="text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 ml-1">{filteredCourses.length}</span>
                    </p>
                    <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <button className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">1</button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default Admin_CoursesTab;
