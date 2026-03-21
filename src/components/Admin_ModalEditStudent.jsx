import React from "react";
import { MdClose } from "react-icons/md";

function Admin_ModalEditStudent({ isOpen, onClose, form, onChange, onSubmit, loading, error }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit Student</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <MdClose className="text-[24px]" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
                        <input type="text" name="name" value={form.name} onChange={onChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. John Doe" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Roll Number / ID</label>
                        <input type="text" name="roll_no" value={form.roll_no} onChange={onChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. 21CSE001" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email Address</label>
                        <input type="email" name="email" value={form.email} onChange={onChange} required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="e.g. john@univ.edu" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Reset Password <span className="text-xs font-normal text-slate-400">(Leave blank to keep current)</span>
                        </label>
                        <input type="text" name="password" value={form.password} onChange={onChange} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white" placeholder="Enter new password to override..." />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Enrollment Status</label>
                        <select name="status" value={form.status} onChange={onChange} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="graduated">Graduated</option>
                        </select>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Update Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Admin_ModalEditStudent;
