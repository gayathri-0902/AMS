import React, { useState, useRef, useEffect } from "react";
import { 
    MdFilterAlt, 
    MdClose, 
    MdSearch, 
    MdHistory,
    MdArchive,
    MdExpandMore
} from "react-icons/md";

/**
 * A internal helper for premium dropdowns.
 * Replaces standard HTML selects with a styled equivalent.
 */
function CustomSelect({ name, value, options, placeholder, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val) => {
        // Trigger a synthetic change event to match the original handleChange
        onChange({ target: { name, value: val } });
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl 
                    text-xs font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex justify-between items-center group
                    hover:border-blue-500/30 focus:ring-2 focus:ring-blue-500/20
                    ${isOpen ? "ring-2 ring-blue-500/20 border-blue-500/50" : ""}
                `}
            >
                <span className={!value ? "text-slate-400" : ""}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <MdExpandMore 
                    size={18} 
                    className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-500" : ""}`} 
                />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            className={`
                                px-4 py-2.5 text-xs font-medium cursor-pointer transition-colors
                                ${value === opt.value 
                                    ? "bg-blue-500 text-white" 
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"}
                            `}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * A compact, horizontal filter bar for the Admin Dashboard.
 * Enhanced with premium custom components and glassmorphism.
 */
function Admin_FilterBar({ formData, handleChange, handleFetch, clearFilters, loading, toggleArchivedView, isArchived }) {
    const isFiltered = Object.values(formData).some(val => val !== "" && val !== "false");

    const yearOptions = [
        { value: "", label: "All Years" },
        { value: "1", label: "Year 1" },
        { value: "2", label: "Year 2" },
        { value: "3", label: "Year 3" },
        { value: "4", label: "Year 4" },
    ];

    const semOptions = [
        { value: "", label: "All Semesters" },
        { value: "1", label: "Semester 1" },
        { value: "2", label: "Semester 2" },
    ];

    return (
        <div className="w-full mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Outer Container with Glow effect */}
            <div className="bg-white dark:bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-[1.8rem] shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-2 flex flex-col lg:flex-row items-center gap-3">
                
                {/* Year Select Container */}
                <div className="w-full lg:w-36">
                    <CustomSelect 
                        name="yr"
                        value={formData.yr}
                        options={yearOptions}
                        placeholder="All Years"
                        onChange={handleChange}
                    />
                </div>

                {/* Sem Select Container */}
                <div className="w-full lg:w-40">
                    <CustomSelect 
                        name="sem"
                        value={formData.sem}
                        options={semOptions}
                        placeholder="All Semesters"
                        onChange={handleChange}
                    />
                </div>

                {/* Stream Input with Premium Icon Styling */}
                <div className="w-full lg:flex-1 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                         <MdHistory size={16} />
                    </div>
                    <input 
                        type="text" 
                        name="stream" 
                        placeholder="Stream (e.g. CSE)" 
                        value={formData.stream} 
                        onChange={handleChange} 
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 placeholder-slate-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                    />
                </div>

                {/* Cycle Input with Premium Icon Styling */}
                <div className="w-full lg:flex-1 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                         <MdFilterAlt size={16} />
                    </div>
                    <input 
                        type="text" 
                        name="academic_yr" 
                        placeholder="Cycle (2021-25)" 
                        value={formData.academic_yr} 
                        onChange={handleChange} 
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 placeholder-slate-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                    />
                </div>

                {/* Action Buttons Hub */}
                <div className="flex gap-2 w-full lg:w-auto ml-auto px-1">
                    <button 
                        onClick={() => handleFetch()}
                        disabled={loading}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
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
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 active:scale-95 transition-all"
                        >
                            <MdClose size={16} />
                            Reset
                        </button>
                    )}

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden lg:block"></div>

                    <button
                        onClick={toggleArchivedView}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95
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
