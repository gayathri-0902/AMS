import React from "react";
import { 
    MdFilterAlt, 
    MdClose, 
    MdSearch, 
    MdHistory,
    MdArchive
} from "react-icons/md";

/**
 * A compact, horizontal filter bar for the Admin Dashboard.
 * Designed to be embedded at the top of each management tab.
 */
function Admin_FilterBar({ formData, handleChange, handleFetch, clearFilters, loading, toggleArchivedView, isArchived }) {
    const isFiltered = Object.values(formData).some(val => val !== "" && val !== "false");

    return (
        <div className="w-full mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] shadow-sm p-2 flex flex-col lg:flex-row items-center gap-2">
                
                {/* Year Select */}
                <div className="w-full lg:w-32 group">
                    <select 
                        name="yr" 
                        value={formData.yr} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Years</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                    </select>
                </div>

                {/* Sem Select */}
                <div className="w-full lg:w-36">
                    <select 
                        name="sem" 
                        value={formData.sem} 
                        onChange={handleChange} 
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Semesters</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                    </select>
                </div>

                {/* Stream Input */}
                <div className="w-full lg:flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                         <MdHistory size={14} />
                    </div>
                    <input 
                        type="text" 
                        name="stream" 
                        placeholder="Stream (e.g. CSE)" 
                        value={formData.stream} 
                        onChange={handleChange} 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                    />
                </div>

                {/* Academic Year Input */}
                <div className="w-full lg:flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                         <MdFilterAlt size={14} />
                    </div>
                    <input 
                        type="text" 
                        name="academic_yr" 
                        placeholder="Cycle (e.g. 2021-25)" 
                        value={formData.academic_yr} 
                        onChange={handleChange} 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full lg:w-auto ml-auto px-2">
                    <button 
                        onClick={() => handleFetch()}
                        disabled={loading}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <MdSearch size={16} />
                                Apply
                            </>
                        )}
                    </button>

                    {isFiltered && (
                        <button 
                            onClick={clearFilters}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                        >
                            <MdClose size={16} />
                            Reset
                        </button>
                    )}

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden lg:block"></div>

                    <button
                        onClick={toggleArchivedView}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${isArchived 
                                ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-300 dark:hover:border-slate-700"}`}
                        title={isArchived ? "Switch to Active View" : "View Archived Records"}
                    >
                        <MdArchive size={16} />
                        {isArchived ? "Archive Active" : "View Archive"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Admin_FilterBar;
