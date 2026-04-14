import React from "react";
import {
    MdClose,
    MdAlternateEmail,
    MdLockOutline,
    MdCheckCircle
} from "react-icons/md";

function Admin_ModalEditFaculty({ isOpen, onClose, form, onChange, onSubmit, loading, error }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            {/* Modal Content */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] p-8 md:p-16 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <MdClose className="text-[28px]" />
                </button>

                {/* Modal Header */}
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                        Edit Faculty Member
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Update the professional profile and credentials
                    </p>
                </div>

                {/* Form Fields */}
                <form onSubmit={onSubmit} className="space-y-6">

                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                            Name
                        </label>
                        <div className="relative group">
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:ring-0 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-semibold transition-all outline-none"
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={onChange}
                                placeholder="Enter full name"
                                required
                            />
                            <div className="absolute inset-0 rounded-2xl border border-slate-200 dark:border-slate-700 pointer-events-none group-focus-within:hidden"></div>
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                            Email
                        </label>
                        <div className="relative group">
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:ring-0 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-semibold transition-all outline-none"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={onChange}
                                placeholder="faculty@institution.edu"
                                required
                            />
                            <div className="absolute inset-0 rounded-2xl border border-slate-200 dark:border-slate-700 pointer-events-none group-focus-within:hidden"></div>
                        </div>
                    </div>

                    {/* Username Field */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                            Username
                        </label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                <MdAlternateEmail className="text-[20px]" />
                            </div>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:ring-0 rounded-2xl pl-12 pr-5 py-4 text-slate-800 dark:text-white font-semibold transition-all outline-none"
                                type="text"
                                name="user_name"
                                value={form.user_name}
                                onChange={onChange}
                                placeholder="user_name"
                                required
                            />
                            <div className="absolute inset-0 rounded-2xl border border-slate-200 dark:border-slate-700 pointer-events-none group-focus-within:hidden"></div>
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                            New Password (leave blank to keep current)
                        </label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                <MdLockOutline className="text-[20px]" />
                            </div>
                            <input
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:ring-0 rounded-2xl pl-12 pr-5 py-4 text-slate-800 dark:text-white font-semibold transition-all outline-none"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={onChange}
                                placeholder="••••••••"
                            />
                            <div className="absolute inset-0 rounded-2xl border border-slate-200 dark:border-slate-700 pointer-events-none group-focus-within:hidden"></div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-800 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full md:flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:flex-[1.5] py-4 px-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <MdCheckCircle className="text-[20px]" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Admin_ModalEditFaculty;