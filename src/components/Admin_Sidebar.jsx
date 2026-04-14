import React from "react";
import {
    MdPeople,
    MdPerson,
    MdMenuBook,
    MdCalendarToday,
    MdChevronLeft,
    MdChevronRight
} from "react-icons/md";

function Admin_Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
    const navLinkClass = (tabName) => `
        flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-300 cursor-pointer group
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
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out`}>
            <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-in fade-in duration-500">
                        <span className="text-xl font-bold text-blue-600 tracking-tight whitespace-nowrap">
                            Admin Dashboard
                        </span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-3">
                {menuItems.map((item) => (
                    <a
                        key={item.label}
                        onClick={() => setActiveTab(item.label)}
                        className={navLinkClass(item.label)}
                        title={isCollapsed ? item.label : ""}
                    >
                        <item.icon size={22} className={activeTab === item.label ? 'scale-110' : 'group-hover:scale-110 transition-transform duration-300'} />
                        {!isCollapsed && (
                            <span className="text-sm font-bold tracking-tight animate-in fade-in slide-in-from-left-2 duration-300">
                                {item.label}
                            </span>
                        )}
                    </a>
                ))}
            </nav>


        </aside>
    );
}

export default Admin_Sidebar;
