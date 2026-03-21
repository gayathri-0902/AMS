import React from "react";
import { MdPersonAdd, MdSearch, MdEdit, MdDelete } from "react-icons/md";

function Admin_FacultiesTab({ batchData }) {
    return (
        <div className="w-full flex-1 max-w-7xl mx-auto py-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Faculty Directory</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage institutional staff and academic departments.
                    </p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <MdPersonAdd className="text-[18px]" />
                    Add Faculty Member
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]" />
                    <input
                        type="text"
                        placeholder="Search by name, ID or department..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold uppercase">Name &amp; Identity</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase">Email</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase">Courses</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {batchData.faculties.length > 0 ? batchData.faculties.map((f, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                                {f.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{f.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{f.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                            {f.courses.join(', ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-1.5 text-slate-400 hover:text-blue-600">
                                                <MdEdit className="text-[20px]" />
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-red-500">
                                                <MdDelete className="text-[20px]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-slate-400">No faculty found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex justify-between border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Showing {batchData.faculties.length} faculty members</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded">1</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin_FacultiesTab;
