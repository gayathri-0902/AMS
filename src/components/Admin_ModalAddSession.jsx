import React from "react";
import { MdClose, MdExpandMore, MdSchedule, MdBook, MdPerson, MdLocationOn } from "react-icons/md";

function Admin_ModalAddSession({
    isOpen,
    onClose,
    form,
    onChange,
    onSubmit,
    loading,
    error,
    courses = [],
    faculties = []
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            New Timetable Session
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Add a new academic slot to the schedule.
                        </p>
                    </div>
                    <button onClick={onClose}>
                        <MdClose className="text-2xl text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit}>
                    <div className="px-8 py-6 space-y-6">

                        {/* Row 1 */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                    <MdSchedule className="text-blue-500" /> Day
                                </label>
                                <select
                                    name="day"
                                    value={form.day}
                                    onChange={onChange}
                                    className="w-full mt-2 p-3 rounded-lg bg-slate-50 border"
                                >
                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                                        <option key={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-600">Session No</label>
                                <input
                                    type="number"
                                    name="session"
                                    value={form.session}
                                    onChange={onChange}
                                    className="w-full mt-2 p-3 rounded-lg bg-slate-50 border"
                                />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-semibold text-slate-600">Start Time</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={form.start_time}
                                    onChange={onChange}
                                    className="w-full mt-2 p-3 rounded-lg bg-slate-50 border"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-600">End Time</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={form.end_time}
                                    onChange={onChange}
                                    className="w-full mt-2 p-3 rounded-lg bg-slate-50 border"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                <MdBook className="text-green-500" /> Course
                            </label>
                            <select
                                name="course"
                                value={form.course}
                                onChange={onChange}
                                className="w-full mt-2 p-3 rounded-lg bg-slate-50 border"
                            >
                                <option value="">Select Course</option>
                                {courses.map((c, idx) => (
                                    <option key={c.course_code || idx} value={c.course_name}>
                                        {c.course_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Faculty + Location */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                    <MdPerson className="text-orange-500" /> Faculty
                                </label>
                                <select
                                    name="faculty"
                                    value={form.faculty}
                                    onChange={onChange}
                                    className="w-full mt-2 p-3 rounded-lg bg-slate-50 border"
                                >
                                    <option value="">Select Faculty</option>
                                    {faculties.map((f, idx) => (
                                        <option key={f.email || idx} value={f.email}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                    <MdLocationOn className="text-red-500" /> Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={form.location}
                                    onChange={onChange}
                                    placeholder="Room 302"
                                    className="w-full mt-2 p-3 rounded-lg bg-slate-50 border"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 flex justify-end gap-4 bg-slate-50 dark:bg-slate-800/30">
                        <button type="button" onClick={onClose} className="px-4 py-2">
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            {loading ? "Adding..." : "Add Session"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Admin_ModalAddSession;