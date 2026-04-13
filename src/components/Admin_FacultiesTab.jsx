import React from "react";
import { MdPersonAdd, MdSearch, MdEdit, MdDelete } from "react-icons/md";
import Admin_FilterBar from "./Admin_FilterBar";

function Admin_FacultiesTab({
    batchData,
    formData,
    searchTerm,
    onAddFaculty,
    onEditFaculty,
    handleChange,
    handleFetch,
    clearFilters,
    loading
}) {
    // Local filter based on searchTerm
    const filteredFaculties = (batchData?.faculties || []).filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.courses && f.courses.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (f.batches && f.batches.some(b => b.toLowerCase().includes(searchTerm.toLowerCase())))
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

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {isFiltered
                            ? `Faculty members assigned to the current filtered batch.`
                            : `Full access to all ${batchData?.faculties?.length || 0} registered institutional staff.`}
                    </p>
                </div>
                <button
                    onClick={onAddFaculty}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <MdPersonAdd className="text-xl" />
                    Register New Staff
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none h-full flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Faculty Member</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact Email</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assigned Courses</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Batches</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredFaculties.length > 0 ? filteredFaculties.map((f, i) => (
                                <tr key={f._id || i} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-11 w-11 rounded-[0.8rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20 tracking-tighter">
                                                {f.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{f.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400 italic">
                                        {f.email}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                            {f.courses && f.courses.length > 0 ? (
                                                f.courses.map((course, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                                                        {course}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] font-medium text-slate-300 dark:text-slate-600 italic">No courses assigned</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                            {f.batches && f.batches.length > 0 ? (
                                                f.batches.map((batch, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                        {batch}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] font-medium text-slate-300 dark:text-slate-600 italic">Global Access</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEditFaculty(f)}
                                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                title="Edit Faculty"
                                            >
                                                <MdEdit className="text-[20px]" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all cursor-not-allowed opacity-50" title="Delete functionality pending">
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
                                            <p className="font-bold uppercase tracking-widest text-slate-300">No Faculty Found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-auto px-8 py-5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Total Staff Count: <span className="text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 ml-1">{filteredFaculties.length}</span>
                    </p>
                    <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <button className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">1</button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default Admin_FacultiesTab;
