import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    MdFeedback, 
    MdPlayArrow, 
    MdStop, 
    MdFileDownload,
    MdSearch
} from "react-icons/md";

/**
 * Admin_FeedbackTab
 * 
 * Allows administrators to:
 * 1. View all academic batches (YrSem).
 * 2. Select specific batches (or all) to open a feedback phase (Mid-1, Mid-2, End-Sem).
 * 3. Close active feedback sessions manually.
 * 4. Export aggregated feedback reports to Excel with scorecards and comments.
 */
function Admin_FeedbackTab() {
    const [batches, setBatches] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [targetPhase, setTargetPhase] = useState("Mid-1");
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/batches`);
            setBatches(res.data);
        } catch (err) {
            console.error("Error fetching batches:", err);
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (filteredBatches) => {
        if (selectedIds.length === filteredBatches.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredBatches.map(b => b._id));
        }
    };

    const handleTogglePhase = async (phase) => {
        if (selectedIds.length === 0) return alert("Please select at least one batch from the list.");
        
        const confirmMsg = phase === "None" 
            ? "Are you sure you want to CLOSE the feedback session for all selected batches?" 
            : `Are you sure you want to OPEN the ${phase} feedback session for all selected batches?`;
            
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/feedback/toggle`, {
                yr_sem_ids: selectedIds,
                target_phase: phase
            });
            fetchBatches();
            alert(`Success: Feedback session ${phase === "None" ? "Closed" : "Opened as " + phase}.`);
            setSelectedIds([]); // Clear selection after action
        } catch (err) {
            console.error(err);
            alert("Failed to update feedback phase. Please check the console.");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (selectedIds.length === 0) {
            if (!window.confirm(`Exporting reports for ALL batches for the ${targetPhase} phase. Continue?`)) return;
        }

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/feedback/export`, 
                { 
                    params: { phase: targetPhase, yr_sem_ids: selectedIds.join(",") },
                    responseType: 'blob' 
                }
            );
            
            // Generate download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Feedback_Report_${targetPhase}_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error(err);
            alert("Export failed. Make sure there is collected data for the selected phase and batches.");
        }
    };

    // Filtering logic
    const filteredBatches = batches.filter(b => 
        b.stream.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.academic_yr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `Y${b.yr}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `S${b.sem}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full flex-1 max-w-7xl mx-auto py-4 animate-in fade-in duration-500">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Feedback Hub</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium italic">
                        Manually trigger or close feedback windows for academic batches.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Search Bar */}
                    <div className="relative group mr-2">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search batches..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs font-bold outline-none transition-all w-48 md:w-64"
                        />
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phase:</span>
                        <select 
                            value={targetPhase}
                            onChange={(e) => setTargetPhase(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                            <option value="Mid-1">Mid-1</option>
                            <option value="Mid-2">Mid-2</option>
                            <option value="End-Sem">End-Sem</option>
                        </select>
                    </div>

                    <button
                        onClick={() => handleTogglePhase(targetPhase)}
                        disabled={loading || selectedIds.length === 0}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MdPlayArrow className="text-xl" />
                        Start {targetPhase}
                    </button>

                    <button
                        onClick={() => handleTogglePhase("None")}
                        disabled={loading || selectedIds.length === 0}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        title="Close all selected feedback windows"
                    >
                        <MdStop className="text-xl" />
                        Close All
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                    >
                        <MdFileDownload className="text-xl text-emerald-500" />
                        Export {targetPhase}
                    </button>
                </div>
            </div>

            {/* Batch Table Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 w-10">
                                    <input
                                        type="checkbox"
                                        checked={filteredBatches.length > 0 && selectedIds.length === filteredBatches.length}
                                        onChange={() => handleSelectAll(filteredBatches)}
                                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                                    />
                                </th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Academic Year</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stream / Department</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Year / Sem</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Active Window</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredBatches.length > 0 ? filteredBatches.map((b) => (
                                <tr key={b._id} className={`group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all ${selectedIds.includes(b._id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(b._id)}
                                            onChange={() => handleToggleSelect(b._id)}
                                            className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                            {b.academic_yr}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{b.stream}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg inline-block border border-slate-200 dark:border-slate-700">
                                            Y{b.yr} - S{b.sem}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                                            ${b.active_feedback_phase !== "None" 
                                                ? "bg-emerald-100/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50" 
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${b.active_feedback_phase !== "None" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                                            {b.active_feedback_phase}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 text-slate-400 italic">
                                        No batches found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Info Footer */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Total Batches: {batches.length} | Selected: {selectedIds.length}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Admin_FeedbackTab;
