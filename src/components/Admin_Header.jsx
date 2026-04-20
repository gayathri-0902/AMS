import React from "react";
import { MdLogout, MdSearch } from "react-icons/md";

function Admin_Header({ activeTab, logout, searchTerm, setSearchTerm, showSearch }) {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
                <button
                    onClick={logout}
                    className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 text-slate-500 transition-colors"
                    title="Logout"
                >
                    <MdLogout className="text-[24px]" />
                </button>
                <h1 className="text-xl font-semibold hidden md:block">{activeTab}</h1>
            </div>

            {showSearch && (
                <div className="flex-1 max-w-md mx-8 relative group">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            )}

        </header>
    );
}

export default Admin_Header;
