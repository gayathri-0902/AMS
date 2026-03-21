import React from "react";
import { MdLogout } from "react-icons/md";

function Admin_Header({ activeTab, logout }) {
    return (
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
                <button
                    onClick={logout}
                    className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 text-slate-500 transition-colors"
                    title="Logout"
                >
                    <MdLogout className="text-[24px]" />
                </button>
                <h1 className="text-xl font-semibold">{activeTab}</h1>
            </div>
        </header>
    );
}

export default Admin_Header;
