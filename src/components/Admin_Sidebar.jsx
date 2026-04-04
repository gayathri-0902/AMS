import React from "react";
import {
    MdPublishedWithChanges,
    MdPeople,
    MdPerson,
    MdMenuBook,
    MdCalendarToday,
} from "react-icons/md";

function Admin_Sidebar({ activeTab, setActiveTab }) {
    const navLinkClass = (tabName) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
        ${activeTab === tabName
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600"}
    `;

    const menuItems = [
        { label: "Students", icon: MdPeople },
        { label: "Faculties", icon: MdPerson },
        { label: "Courses", icon: MdMenuBook },
        { label: "Schedule", icon: MdCalendarToday },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-blue-600">
                    <span className="font-bold text-xl tracking-tight">Admin Dashboard</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
                {menuItems.map((item) => (
                    <a
                        key={item.label}
                        onClick={() => setActiveTab(item.label)}
                        className={navLinkClass(item.label)}
                    >
                        <item.icon size={22} className={activeTab === item.label ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                        <span className="text-sm font-bold tracking-tight">{item.label}</span>
                    </a>
                ))}
            </nav>

        </aside>
    );
}

export default Admin_Sidebar;
