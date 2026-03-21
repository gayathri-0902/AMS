import React from "react";
import {
    MdPublishedWithChanges,
    MdPeople,
    MdPerson,
    MdMenuBook,
    MdCalendarToday,
} from "react-icons/md";

function Admin_Sidebar({ activeTab, isBatchSelected, setActiveTab }) {
    const navLinkClass = (tabName) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer
        ${activeTab === tabName
            ? "bg-blue-600/10 text-blue-600"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}
        ${!isBatchSelected && tabName !== "Change Batch" ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}
    `;

    return (
        <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">

                <div className="py-2">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Configuration
                    </p>
                    <a onClick={() => setActiveTab("Change Batch")} className={navLinkClass("Change Batch")}>
                        <MdPublishedWithChanges className="text-[22px]" />
                        <span className="text-sm font-medium">Change Batch</span>
                    </a>
                </div>

                <div className="py-2">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Menu
                    </p>

                    <a onClick={() => isBatchSelected && setActiveTab("Students")} className={navLinkClass("Students")}>
                        <MdPeople className="text-[22px]" />
                        <span className="text-sm font-medium">Students</span>
                    </a>

                    <a onClick={() => isBatchSelected && setActiveTab("Faculties")} className={navLinkClass("Faculties")}>
                        <MdPerson className="text-[22px]" />
                        <span className="text-sm font-medium">Faculties</span>
                    </a>

                    <a onClick={() => isBatchSelected && setActiveTab("Courses")} className={navLinkClass("Courses")}>
                        <MdMenuBook className="text-[22px]" />
                        <span className="text-sm font-medium">Courses</span>
                    </a>

                    <a onClick={() => isBatchSelected && setActiveTab("Schedule")} className={navLinkClass("Schedule")}>
                        <MdCalendarToday className="text-[22px]" />
                        <span className="text-sm font-medium">Schedule</span>
                    </a>
                </div>

            </nav>
        </aside>
    );
}

export default Admin_Sidebar;
