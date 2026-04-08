import React from "react";
import {
    MdFileDownload,
    MdPersonAdd,
    MdSearch,
    MdEdit,
    MdDelete,
    MdDoubleArrow,
} from "react-icons/md";
import Admin_FilterBar from "./Admin_FilterBar";

/**
 * Purely presentational Students tab.
 * Receives all data and callbacks via props — owns no state.
 */
function Admin_StudentsTab({ 
    batchData, 
    formData, 
    searchTerm, 
    onAddStudent, 
    onEditStudent, 
    selectedIds = [], 
    onToggleSelect, 
    onSelectAll, 
    onPromote,
    handleChange,
    handleFetch,
    clearFilters,
    loading,
    loadingMore,
    hasMore,
    loadMore
}) {
    // Local filter based on searchTerm
    const filteredStudents = (batchData?.students || []).filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.batch && s.batch.toLowerCase().includes(searchTerm.toLowerCase()))
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

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Student Directory</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium italic">
                        {isFiltered 
                            ? `Filtered view for current criteria`
                            : `Full access to all ${batchData?.totalStudents || 0} student records.`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter - Tab Specific Refinement */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status:</span>
                        <select 
                            name="status" 
                            value={formData.status} 
                            onChange={(e) => {
                                handleChange(e);
                                handleFetch({ status: e.target.value }); // Immediate override
                            }}
                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                            <option value="active">Active Students</option>
                            <option value="inactive">Previous History</option>
                            <option value="graduated">Alumni (Graduated)</option>
                        </select>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={onPromote}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-600/20"
                        >
                            <MdDoubleArrow className="text-xl" />
                            Promote ({selectedIds.length}) (Batch +1)
                        </button>
                    )}
                    <button
                        onClick={onAddStudent}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
                    >
                        <MdPersonAdd className="text-xl" />
                        Add New Student
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden h-full flex flex-col">
                
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                                        checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                                        onChange={() => onSelectAll(filteredStudents)}
                                    />
                                </th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student Information</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Academic Batch</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStudents.length > 0 ? filteredStudents.map((s, i) => (
                                <tr key={s._id} className={`group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all ${selectedIds.includes(s._id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all group-hover:border-blue-400"
                                            checked={selectedIds.includes(s._id)}
                                            onChange={() => onToggleSelect(s._id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-11 w-11 rounded-[0.8rem] flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
                                                {s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{s.name}</div>
                                                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">ID: {s.roll_no}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{s.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg inline-block border border-slate-200 dark:border-slate-700">
                                            {s.batch}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                                            ${s.status === "active" ? "bg-emerald-100/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50" :
                                                s.status === "inactive" ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700" :
                                                    "bg-amber-100/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${s.status === "active" ? "bg-emerald-500" : s.status === "inactive" ? "bg-slate-400" : "bg-amber-500"}`}></span>
                                            {s.status || "Active"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onEditStudent(s)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Edit Student">
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
                                    <td colSpan="6" className="text-slate-400 text-center py-20 bg-slate-50/30 dark:bg-slate-800/10">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                                                <MdSearch className="text-5xl opacity-20" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">No Matches Found</p>
                                            <p className="text-sm max-w-[240px]">Try adjusting your search terms or clearing the batch filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Section - Pagination/Load More */}
                <div className="mt-auto px-8 py-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 gap-4">
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        Showing <span className="text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{filteredStudents.length}</span> entries 
                        {batchData?.totalStudents > 0 && ` out of ${batchData.totalStudents}`}
                    </div>
                    
                    {hasMore && (
                        <button 
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-xl font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                            ) : (
                                "Load More Students"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


export default Admin_StudentsTab;
