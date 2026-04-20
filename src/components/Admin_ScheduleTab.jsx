import React from "react";
import Admin_FilterBar from "./Admin_FilterBar";
import { MdLayers } from "react-icons/md";

/**
 * Schedule Tab with Days as Rows and Sessions as Columns.
 * Focuses on data integration and hook-driven filtering.
 */
function Admin_ScheduleTab({
    batchData,
    formData,
    onAddSession,
    handleChange,
    handleFetch,
    clearFilters,
    loading,
    toggleArchivedView,
    isArchived
}) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timetable = batchData?.timetable || [];
    // Correct logic: Only show the grid if the server confirms we have filtered data.
    const isFiltered = !!batchData?.isFiltered;

    // 1. Helper: Time string to minutes (e.g., "09:30" -> 570)
    const timeToMin = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    // 2. Find unique sessions and their times
    const sessionInfoMap = {};
    timetable.forEach(entry => {
        if (!sessionInfoMap[entry.session_no]) {
            sessionInfoMap[entry.session_no] = {
                start: entry.start_time,
                end: entry.end_time,
                startMin: timeToMin(entry.start_time),
                endMin: timeToMin(entry.end_time)
            };
        }
    });

    const sessionList = Object.keys(sessionInfoMap)
        .map(Number)
        .sort((a, b) => a - b);

    // 3. Detect common gaps (breaks) between sessions
    const recessGaps = [];
    for (let i = 0; i < sessionList.length - 1; i++) {
        const current = sessionInfoMap[sessionList[i]];
        const next = sessionInfoMap[sessionList[i + 1]];
        if (next.startMin - current.endMin >= 45) {
            recessGaps.push({ start: current.end, end: next.start, afterSession: sessionList[i] });
        }
    }

    // 4. Organize data into a grid: { [day]: { [session_no]: entry } }
    const gridData = {};
    timetable.forEach(entry => {
        if (!gridData[entry.day_of_week]) gridData[entry.day_of_week] = {};
        gridData[entry.day_of_week][entry.session_no] = entry;
    });

    const getSessionColor = (dayIdx, sessIdx) => {
        const colors = [
            "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
            "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500",
            "bg-orange-50 dark:bg-orange-900/20 border-orange-500",
            "bg-rose-50 dark:bg-rose-900/20 border-rose-500",
            "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500",
            "bg-slate-50 dark:bg-slate-800/40 border-slate-400"
        ];
        return colors[(dayIdx + sessIdx) % colors.length];
    };

    return (
        <div className="w-full flex-1 max-w-7xl mx-auto py-4">
            <Admin_FilterBar
                formData={formData}
                handleChange={handleChange}
                handleFetch={handleFetch}
                clearFilters={clearFilters}
                loading={loading}
                toggleArchivedView={toggleArchivedView}
                isArchived={isArchived}
            />

            {(!isFiltered) ? (
                <div className="w-full bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 py-32 flex flex-col items-center justify-center text-center px-6 leading-tight animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-8">
                        <MdLayers size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-3 tracking-tight">Select a Batch to Filter</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs text-sm leading-relaxed italic">
                        The timetable grid will appear here once you select a valid Year, Semester and Stream.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto">
                        <div className="min-w-full">

                            {/* Header Row: Sessions as Columns */}
                            <div className="flex bg-slate-50/80 dark:bg-slate-800/50 border-b">
                                <div className="min-w-[100px] p-2 border-r bg-slate-50 dark:bg-slate-800"></div>
                                {sessionList.map((sessionNo) => {
                                    const info = sessionInfoMap[sessionNo];
                                    const items = [];
                                    items.push(
                                        <div key={sessionNo} className="flex-1 min-w-[140px] p-2 text-center border-r">
                                            <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Session {sessionNo}</div>
                                            <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{info.start} - {info.end}</div>
                                        </div>
                                    );

                                    // Gap column in header
                                    const gap = recessGaps.find(g => g.afterSession === sessionNo);
                                    if (gap) {
                                        items.push(
                                            <div key={`gap-h-${sessionNo}`} className="w-[40px] flex items-center justify-center border-r bg-slate-100/30">
                                                <span className="text-[7px] font-black uppercase text-slate-400">Break</span>
                                            </div>
                                        );
                                    }
                                    return items;
                                })}
                            </div>

                            {/* Row Body: Days as Rows */}
                            <div className="bg-white dark:bg-slate-900">
                                {days.map((day, dayIdx) => (
                                    <div key={day} className="flex border-b last:border-b-0 transition-colors">
                                        {/* Day Column (Side Header) */}
                                        <div className="min-w-[100px] p-4 border-r flex flex-col justify-center bg-white dark:bg-slate-900 z-10">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{day}</span>
                                        </div>

                                        {/* Session Columns */}
                                        {sessionList.map((sessionNo, sessIdx) => {
                                            const entry = gridData[day]?.[sessionNo];
                                            const items = [];

                                            items.push(
                                                <div key={`${day}-${sessionNo}`} className="flex-1 min-w-[140px] p-1.5 border-r flex">
                                                    {entry ? (
                                                        <div className={`w-full border-l-[3px] p-3 rounded-lg shadow-sm border ${getSessionColor(dayIdx, sessIdx)}`}>
                                                            <div className="flex justify-between items-start mb-1 overflow-hidden">
                                                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex-1 tracking-tight leading-tight" title={entry.course_name}>
                                                                    {entry.course_name}
                                                                </h4>
                                                            </div>
                                                            <p className="text-[8px] font-semibold text-slate-500 mb-2">{entry.course_code}</p>
                                                            <div className="mt-auto pt-2 border-t border-black/5 flex flex-col gap-0.5">
                                                                <p className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                                                                    {entry.faculty_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full rounded-lg border border-dashed border-slate-100 dark:border-slate-800/50 flex items-center justify-center opacity-30">
                                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Free</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );

                                            // Gap column in body
                                            const gap = recessGaps.find(g => g.afterSession === sessionNo);
                                            if (gap) {
                                                items.push(
                                                    <div key={`gap-b-${day}-${sessionNo}`} className="w-[40px] flex items-center justify-center border-r bg-slate-50/20">
                                                        <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-800 rounded-full opacity-30"></div>
                                                    </div>
                                                );
                                            }
                                            return items;
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>


                </div>
            )}

            <div className="mt-6 flex justify-end px-2">
                <button
                    onClick={onAddSession}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                    Add New Session
                </button>
            </div>
        </div>
    );
}

export default Admin_ScheduleTab;
