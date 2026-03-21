import React from "react";
import { MdClose, MdDoubleArrow, MdSchool } from "react-icons/md";

/**
 * Modal to confirm bulk student promotion or graduation.
 */
function Admin_ModalPromote({ isOpen, onClose, selectedCount, currentBatch, onSubmit, loading, error }) {
    if (!isOpen) return null;

    const yr = Number(currentBatch?.yr);
    const sem = Number(currentBatch?.sem);

    // Promotion Logic
    const isFinalSem = yr === 4 && sem === 2;

    let nextYr = yr;
    let nextSem = sem;

    if (!isFinalSem) {
        if (sem === 1) {
            nextSem = 2;
        } else {
            nextSem = 1;
            nextYr = yr + 1;
        }
    }

    const targetYrSem = {
        yr: nextYr,
        sem: nextSem,
        stream: currentBatch?.stream,
        academic_yr: currentBatch?.academic_yr,
        isGraduating: isFinalSem
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {isFinalSem ? <MdSchool className="text-amber-500" /> : <MdDoubleArrow className="text-blue-600" />}
                        {isFinalSem ? "Confirm Graduation" : "Promote Students"}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <MdClose className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                            {selectedCount}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Students Selected</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">Ready for batch advancement</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-4 px-2">
                        <div className="text-center flex-1">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Current Batch</p>
                            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                {yr}-{sem}
                            </p>
                            {/* <p className="text-xs text-slate-500">{currentBatch?.stream}</p> */}
                        </div>

                        <MdDoubleArrow className="text-slate-300 text-2xl" />

                        <div className="text-center flex-1">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-blue-500 mb-1">Target Status</p>
                            {isFinalSem ? (
                                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">GRADUATED</p>
                            ) : (
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {nextYr}-{nextSem}
                                </p>
                            )}
                            {/*<p className="text-xs text-slate-500">{currentBatch?.academic_yr}</p>*/}
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center px-4 leading-relaxed">
                        {isFinalSem
                            ? "These students will be moved to Graduation status. This action marks the completion of their current academic cycle."
                            : `Selected students will be promoted to the next semester (${nextYr}-${nextSem}). This will update their active enrollments.`}
                    </p>

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
                        className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-white dark:hover:bg-slate-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(targetYrSem)}
                        disabled={loading}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-lg
                            ${isFinalSem
                                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}
                            disabled:opacity-50 disabled:shadow-none`}
                    >
                        {loading ? "Processing..." : isFinalSem ? "Confirm Graduation" : "Promote Now"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Admin_ModalPromote;
