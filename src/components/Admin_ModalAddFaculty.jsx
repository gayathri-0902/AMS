import {
    MdClose,
    MdOutlinePerson,
    MdOutlineMail,
    MdOutlineAlternateEmail,
    MdOutlineLock,
    MdOutlineVisibility,
    MdHourglassEmpty,
    MdCheckCircle,
    MdError
} from "react-icons/md";

function Admin_ModalAddFaculty({ isOpen, onClose, form, onChange, onSubmit, loading, error, availability, checkUniqueness }) {
    if (!isOpen) return null;

    const isEmailValid = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(form.email || "");

    // Debounced Uniqueness Check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.user_name && form.user_name !== availability.user_name.checkedValue) {
                checkUniqueness("user_name", form.user_name);
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [form.user_name]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.email && isEmailValid && form.email !== availability.email.checkedValue) {
                checkUniqueness("email", form.email);
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [form.email, isEmailValid]);

    const hasConflict = availability.user_name.exists || availability.email.exists;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            {/* Modal Content */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl flex flex-col gap-8 relative animate-in fade-in zoom-in duration-200">

                {/* Modal Header */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-2xl font-extrabold font-headline tracking-tight text-slate-900 dark:text-white">
                            Add Faculty Member
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Onboard a new academic professional to the institution's directory.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                    >
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={onSubmit} className="space-y-5">

                    {/* Full Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1" htmlFor="name">
                            Full Name
                        </label>
                        <div className="relative group">
                            <MdOutlinePerson className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                            <input
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all outline-none"
                                id="name"
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={onChange}
                                placeholder="e.g. Dr. Julian Pierce"
                                required
                            />
                        </div>
                    </div>

                    {/* Work Email */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1" htmlFor="email">
                            Work Email
                        </label>
                        <div className="relative group">
                            <MdOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                            <input
                                className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none ring-1 ${form.email && (!isEmailValid || availability.email.exists) ? 'ring-red-500 shadow-lg shadow-red-500/10' : 'ring-slate-200 dark:ring-slate-700'} focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all outline-none`}
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={onChange}
                                placeholder="j.pierce@institution.edu"
                                required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {availability.email.loading && <MdHourglassEmpty className="animate-spin text-slate-400" />}
                                {form.email && isEmailValid && !availability.email.loading && availability.email.checkedValue === form.email && (
                                    availability.email.exists ? <MdError className="text-red-500" /> : <MdCheckCircle className="text-green-500" />
                                )}
                            </div>
                        </div>
                        {form.email && !isEmailValid && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-4 animate-in fade-in slide-in-from-top-1 duration-200 uppercase tracking-wider">
                                Invalid Email Format
                            </p>
                        )}
                        {availability.email.exists && availability.email.checkedValue === form.email && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-4 animate-in fade-in slide-in-from-top-1 duration-200 uppercase tracking-wider">
                                Email Already Registered
                            </p>
                        )}
                    </div>

                    {/* Username */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1" htmlFor="user_name">
                            Username
                        </label>
                        <div className="relative group">
                            <MdOutlineAlternateEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                            <input
                                className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none ring-1 ${availability.user_name.exists ? 'ring-red-500 shadow-lg shadow-red-500/10' : 'ring-slate-200 dark:ring-slate-700'} focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all outline-none`}
                                id="user_name"
                                name="user_name"
                                type="text"
                                value={form.user_name}
                                onChange={onChange}
                                placeholder="jpierce_admin"
                                required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {availability.user_name.loading && <MdHourglassEmpty className="animate-spin text-slate-400" />}
                                {form.user_name && !availability.user_name.loading && availability.user_name.checkedValue === form.user_name && (
                                    availability.user_name.exists ? <MdError className="text-red-500" /> : <MdCheckCircle className="text-green-500" />
                                )}
                            </div>
                        </div>
                        {availability.user_name.exists && availability.user_name.checkedValue === form.user_name && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-4 animate-in fade-in slide-in-from-top-1 duration-200 uppercase tracking-wider">
                                Username Already in Use
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1" htmlFor="password">
                            Password
                        </label>
                        <div className="relative group">
                            <MdOutlineLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                            <input
                                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all outline-none"
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={onChange}
                                placeholder="••••••••"
                                required
                            />
                            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                                <MdOutlineVisibility className="text-xl" />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading || !isEmailValid || hasConflict}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-2xl font-bold tracking-wide shadow-lg shadow-blue-600/20 hover:scale-[1.01] transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Add Faculty'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-full py-4 rounded-2xl font-bold tracking-wide hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl -z-10"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-slate-400/10 rounded-full blur-3xl -z-10"></div>
            </div>
        </div>
    );
}

export default Admin_ModalAddFaculty;