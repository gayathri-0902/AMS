import React from "react";
import { MdClose, MdDoubleArrow, MdInfoOutline, MdForward } from "react-icons/md";

/**
 * Modal to confirm bulk student promotion or graduation.
 * Provides a dynamic summary of target batches based on the selected students.
 */
function Admin_ModalPromote({ isOpen, onClose, selectedStudents = [], onSubmit, loading, error }) {
    if (!isOpen) return null;

    // ── Group Selected Students by Batch ─────────────────────────────────────────
    const groupMap = selectedStudents.reduce((acc, s) => {
        const key = s.batch || "N/A";
        if (!acc[key]) {
            acc[key] = {
                count: 0,
                yr: s.yr,
                sem: s.sem,
                stream: s.stream,
                academic_yr: s.academic_yr,
                batchName: key
            };
        }
        acc[key].count++;
        return acc;
    }, {});

    const groups = Object.values(groupMap);

    // ── Group Target Calculation Helper ─────────────────────────────────────────
    const getTargetBatch = (g) => {
        if (!g.yr || !g.sem) return "Manual Review Required";
        
        const yr = Number(g.yr);
        const sem = Number(g.sem);
        
        if (yr === 4 && sem === 2) return "GRADUATED";
        
        if (sem === 1) return `Y${yr}-S2`;
        return `Y${yr + 1}-S1`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MdDoubleArrow className="text-blue-600" />
                        Confirm Bulk Promotion
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <MdClose className="text-slate-500 transition-transform active:scale-90" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-600/30">
                            {selectedStudents.length}
                        </div>
                        <div>
                            <p className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-tight">Students Selected</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Ready for progression summary</p>
                        </div>
                    </div>

                    {/* Dynamic Summary List */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 px-2">
                             <MdInfoOutline className="text-sm" /> Promotion Summary
                        </h4>
                        
                        <div className="max-h-48 overflow-y-auto px-2 space-y-2 pr-4 custom-scrollbar">
                            {groups.map((g, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-900/30 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{g.batchName}</span>
                                        <span className="text-[10px] text-slate-400 font-medium italic">{g.count} Students</span>
                                    </div>
                                    
                                    <MdForward className="text-slate-300 group-hover:text-blue-400 transition-colors" />

                                    <div className="text-right">
                                        <span className={`text-sm font-black tracking-tight ${getTargetBatch(g) === "GRADUATED" ? "text-amber-600" : "text-blue-600"}`}>
                                            {getTargetBatch(g)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed italic border border-slate-100 dark:border-slate-800">
                        * Note: If any target batch (e.g. Y2-S1) is not found in the system for that specific stream, the promotion for that group will be skipped and reported in the final summary.
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit()}
                        disabled={loading}
                        className="flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                        ) : (
                            "Confirm & Promote All"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Admin_ModalPromote;
