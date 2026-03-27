import React from "react";

function Admin_ScheduleTab({ batchData, onAddSession }) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    const timetable = batchData?.timetable || [];

    // 1. Helper: Time string to minutes (e.g., "09:30" -> 570)
    const timeToMin = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    // 2. Helper: Minutes to time string
    const minToTime = (m) => {
        const h = Math.floor(m / 60).toString().padStart(2, "0");
        const min = (m % 60).toString().padStart(2, "0");
        return `${h}:${min}`;
    };

    // 3. Find unique sessions and their times (assumes consistency for session_no)
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

    // 4. Detect common gaps across all days
    // We look for gaps between the end of one session and start of another
    // that exist in the sessionInfoMap (which represents the grid structure)
    const lunchGaps = [];
    for (let i = 0; i < sessionList.length - 1; i++) {
        const current = sessionInfoMap[sessionList[i]];
        const next = sessionInfoMap[sessionList[i + 1]];
        if (next.startMin - current.endMin == 60) { // 60 min gap
            lunchGaps.push({
                start: current.end,
                end: next.start,
                afterSession: sessionList[i]
            });
        }
    }

    // 5. Organize data into a grid: { [session_no]: { [day]: entry } }
    const gridData = {};
    timetable.forEach(entry => {
        if (!gridData[entry.session_no]) gridData[entry.session_no] = {};
        gridData[entry.session_no][entry.day_of_week] = entry;
    });

    const getSessionColor = (index) => {
        const colors = [
            "bg-blue-100 border-blue-500",
            "bg-emerald-100 border-emerald-500",
            "bg-orange-100 border-orange-500",
            "bg-rose-100 border-rose-500",
            "bg-indigo-100 border-indigo-500",
            "bg-slate-100 border-slate-400"
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <main className="py-12 px-8">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="flex justify-between items-end mb-8">
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border rounded-xl text-sm font-medium hover:bg-slate-50">
                                Export PDF
                            </button>
                            <button 
                                onClick={onAddSession}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90"
                            >
                                New Session
                            </button>
                        </div>
                    </div>

                    {/* Timetable */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden">

                        {/* Days Header */}
                        <div className="grid grid-cols-6 border-b">
                            <div className="p-4 border-r bg-slate-50/50 dark:bg-slate-800/50"></div>
                            {fullDays.map(day => (
                                <div key={day} className="p-4 text-center text-xs font-bold uppercase text-slate-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-6">
                            {sessionList.map((sessionNo, index) => {
                                const info = sessionInfoMap[sessionNo];
                                const rows = [];

                                // Render the session row
                                rows.push(
                                    <React.Fragment key={`session-${sessionNo}`}>
                                        {/* Time Column */}
                                        <div className="p-4 text-right border-r border-b text-xs text-slate-500 flex flex-col items-end justify-center h-32">
                                            <span className="font-bold text-slate-400">Session {sessionNo}</span>
                                            <span className="mt-1">{info.start} - {info.end}</span>
                                        </div>

                                        {/* Day Columns */}
                                        {days.map((day, idx) => {
                                            const entry = gridData[sessionNo]?.[day];
                                            return (
                                                <div key={day} className="p-2 border-r border-b min-h-[128px]">
                                                    {entry ? (
                                                        <div className={`h-full border-l-4 p-3 rounded-lg shadow-sm ${getSessionColor(idx + index)}`}>
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="text-xs font-bold truncate flex-1" title={entry.course_name}>
                                                                    {entry.course_name}
                                                                </h4>
                                                            </div>
                                                            <p className="text-[10px] font-medium opacity-80">{entry.course_code}</p>
                                                            <div className="mt-2 pt-2 border-t border-black/5">
                                                                <p className="text-[10px] font-semibold">{entry.faculty_name}</p>
                                                                <p className="text-[9px] opacity-70 flex items-center gap-1 mt-0.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                                                                    {entry.location}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full w-full rounded-lg border-2 border-dashed border-slate-100 dark:border-slate-800/50 flex items-center justify-center">
                                                            <span className="text-[9px] text-slate-300 dark:text-slate-700 font-medium">Free Slot</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                );

                                // Check if a lunch break follows this session
                                const gap = lunchGaps.find(g => g.afterSession === sessionNo);
                                if (gap) {
                                    rows.push(
                                        <React.Fragment key={`lunch-${sessionNo}`}>
                                            <div className="p-4 text-right border-r text-xs text-slate-400 flex flex-col items-center justify-center h-20 bg-slate-50/30 dark:bg-slate-800/20">
                                                <span className="font-bold">Break</span>
                                                <span>{gap.start} - {gap.end}</span>
                                            </div>
                                            <div className="col-span-5 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 text-xs font-bold uppercase text-slate-400 border-b">
                                                Lunch Break
                                            </div>
                                        </React.Fragment>
                                    );
                                }

                                return rows;
                            })}
                        </div>
                    </div>

                    {/* Legend/Info */}
                    <div className="mt-6 flex items-center gap-6 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Major Courses</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Labs & Practicals</span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <span>* All times are in IST</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Admin_ScheduleTab;
