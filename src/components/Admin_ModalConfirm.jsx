import React from "react";
import { MdClose, MdWarning, MdRestore, MdArchive } from "react-icons/md";

function Admin_ModalConfirm({ isOpen, onClose, onConfirm, title, message, loading, type = "archive" }) {
    if (!isOpen) return null;

    const isArchive = type === "archive";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 border border-slate-200 dark:border-slate-800">
                
                {/* Header Decoration */}
                <div className={`h-2 w-full ${isArchive ? "bg-amber-500" : "bg-blue-500"}`}></div>

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${isArchive ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600" : "bg-blue-100 dark:bg-blue-900/20 text-blue-600"}`}>
                            {isArchive ? <MdWarning className="text-3xl" /> : <MdRestore className="text-3xl" />}
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <MdClose className="text-2xl" />
                        </button>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
                        {title}
                    </h3>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={loading}
                            className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm} 
                            disabled={loading}
                            className={`flex-1 px-6 py-3.5 text-sm font-bold text-white rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg disabled:opacity-50
                                ${isArchive 
                                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20" 
                                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isArchive ? <MdArchive className="text-xl" /> : <MdRestore className="text-xl" />}
                                    {isArchive ? "Confirm Archive" : "Confirm Restore"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Subtle Footer info */}
                {isArchive && (
                    <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                        This action can be reversed from the Archive view
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin_ModalConfirm;
