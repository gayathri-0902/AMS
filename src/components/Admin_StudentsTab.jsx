import React from "react";
import {
    MdFileDownload,
    MdPersonAdd,
    MdSearch,
    MdEdit,
    MdDelete,
    MdDoubleArrow,
} from "react-icons/md";

/**
 * Purely presentational Students tab.
 * Receives all data and callbacks via props — owns no state.
 */
function Admin_StudentsTab({ batchData, formData, onAddStudent, onEditStudent, selectedIds = [], onToggleSelect, onSelectAll, onPromote }) {
    return (
        <div className="w-full flex-1 max-w-7xl mx-auto py-4">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Directory</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Manage and monitor all {batchData?.students?.length || 0} registered students in this batch.
                    </p>
                </div>
                <div className="flex gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={onPromote}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20"
                        >
                            <MdDoubleArrow className="text-[20px]" />
                            Promote {selectedIds.length} Selected
                        </button>
                    )}
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                        <MdFileDownload className="text-[20px]" />
                        Export Data
                    </button>
                    <button
                        onClick={onAddStudent}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                    >
                        <MdPersonAdd className="text-[20px]" />
                        Add New Student
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
                    <div className="flex-1 relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]" />
                        <input
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                            placeholder="Search by name, ID or email..."
                            type="text"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={selectedIds.length === (batchData?.students?.length || 0) && (batchData?.students?.length || 0) > 0}
                                        onChange={() => onSelectAll(batchData?.students || [])}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name &amp; Identity</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(batchData?.students?.length || 0) > 0 ? batchData?.students?.map((s, i) => (
                                <tr key={i} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${selectedIds.includes(s._id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={selectedIds.includes(s._id)}
                                            onChange={() => onToggleSelect(s._id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
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
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                            ${s.status === "active" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                                s.status === "inactive" ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" :
                                                    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`}>
                                            {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : "Active"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => onEditStudent(s)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
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
                        Showing <span className="font-semibold text-slate-900 dark:text-slate-100">1 to {batchData.students.length}</span> of{" "}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{batchData.students.length}</span> students
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400 font-medium disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">1</button>
                        <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400 font-medium disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin_StudentsTab;
