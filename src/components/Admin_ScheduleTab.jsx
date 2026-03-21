import React from "react";

function Admin_ScheduleTab() {
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
                            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold shadow-lg hover:opacity-90">
                                New Session
                            </button>
                        </div>
                    </div>

                    {/* Timetable */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden">

                        {/* Days Header */}
                        <div className="grid grid-cols-6 border-b">
                            <div></div>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                                <div key={day} className="p-4 text-center text-xs font-bold uppercase text-slate-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-6 auto-rows-[80px]">

                            {/* 9 AM */}
                            <div className="p-4 text-right border-r text-xs text-slate-400">09:00 AM</div>
                            <div className="p-2 border">
                                <div className="h-full bg-blue-100 border-l-4 border-blue-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Advanced Calculus</h4>
                                    <p className="text-[10px]">MATH401</p>
                                    <p className="text-[10px] mt-1">Dr. Aris Thorne</p>
                                </div>
                            </div>
                            <div className="border"></div>
                            <div className="p-2 border">
                                <div className="h-full bg-orange-100 border-l-4 border-orange-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Quantum Physics</h4>
                                    <p className="text-[10px]">PHY305</p>
                                    <p className="text-[10px] mt-1">Dr. Robert Chen</p>
                                </div>
                            </div>
                            <div className="border"></div>
                            <div className="p-2 border">
                                <div className="h-full bg-blue-100 border-l-4 border-blue-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Advanced Calculus</h4>
                                    <p className="text-[10px]">MATH401</p>
                                </div>
                            </div>

                            {/* 11 AM */}
                            <div className="p-4 text-right border-r text-xs text-slate-400">11:00 AM</div>
                            <div className="border"></div>
                            <div className="p-2 border">
                                <div className="h-full bg-emerald-100 border-l-4 border-emerald-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Data Structures</h4>
                                    <p className="text-[10px]">CS202</p>
                                    <p className="text-[10px] mt-1">Prof. Jenkins</p>
                                </div>
                            </div>
                            <div className="border"></div>
                            <div className="p-2 border">
                                <div className="h-full bg-emerald-100 border-l-4 border-emerald-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Data Structures</h4>
                                    <p className="text-[10px]">CS202</p>
                                </div>
                            </div>
                            <div className="p-2 border">
                                <div className="h-full bg-indigo-100 border-l-4 border-indigo-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Modern Literature</h4>
                                    <p className="text-[10px]">LIT110</p>
                                </div>
                            </div>

                            {/* Lunch */}
                            <div className="p-4 text-right border-r text-xs text-slate-400">01:00 PM</div>
                            <div className="col-span-5 flex items-center justify-center bg-slate-50 text-xs font-bold uppercase text-slate-400">
                                Lunch Break
                            </div>

                            {/* 2 PM */}
                            <div className="p-4 text-right border-r text-xs text-slate-400">02:00 PM</div>
                            <div className="p-2 border">
                                <div className="h-full bg-rose-100 border-l-4 border-rose-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Chemistry Lab</h4>
                                    <p className="text-[10px]">CHE101</p>
                                </div>
                            </div>
                            <div className="p-2 border">
                                <div className="h-full bg-orange-100 border-l-4 border-orange-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Quantum Physics</h4>
                                    <p className="text-[10px]">PHY305</p>
                                </div>
                            </div>
                            <div className="border"></div>
                            <div className="p-2 border">
                                <div className="h-full bg-rose-100 border-l-4 border-rose-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Chemistry Lab</h4>
                                    <p className="text-[10px]">CHE101</p>
                                </div>
                            </div>
                            <div className="border"></div>

                            {/* 4 PM */}
                            <div className="p-4 text-right border-r text-xs text-slate-400">04:00 PM</div>
                            <div className="border"></div>
                            <div className="p-2 border">
                                <div className="h-full bg-slate-100 border-l-4 border-slate-400 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Faculty Meeting</h4>
                                </div>
                            </div>
                            <div className="p-2 border">
                                <div className="h-full bg-indigo-100 border-l-4 border-indigo-500 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold">Modern Literature</h4>
                                </div>
                            </div>
                            <div className="border"></div>
                            <div className="p-2 border flex items-center justify-center text-xs text-slate-400">
                                Early Dismissal
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Admin_ScheduleTab;
