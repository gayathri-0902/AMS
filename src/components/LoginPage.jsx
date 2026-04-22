import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import {
  MdAdminPanelSettings,
  MdSchool,
  MdSupervisorAccount,
  MdCastForEducation,
  MdPerson
} from "react-icons/md";

function LoginPage() {
  const [activeTab, setActiveTab] = useState("Faculty");
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(activeTab.toLowerCase(), credentials.identifier, credentials.password);
    } catch (error) {
      alert(error.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    const iconStyle = { color: "#94a3b8" };
    switch (activeTab) {
      case "Admin":
        return <MdAdminPanelSettings size={26} style={iconStyle} />;
      case "Faculty":
        return <MdCastForEducation size={26} style={iconStyle} />;
      case "Student":
        return <MdSchool size={26} style={iconStyle} />;
      case "Parent":
        return <MdSupervisorAccount size={26} style={iconStyle} />;
      default:
        return <MdPerson size={26} style={iconStyle} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-slate-950 p-6 font-antiqua transition-colors">
      <div className="w-full max-w-[520px] bg-white dark:bg-slate-900 shadow-[0_10px_40px_rgba(0,0,0,0.06)] dark:shadow-none rounded-[32px] p-12 flex flex-col items-center border dark:border-slate-800">

        <div className="mb-6">
          <img
            src="/logo.jpeg"
            alt="AIMSCS Logo"
            className="w-24 h-24 object-contain rounded-2xl"
          />
        </div>

        <h1 className="text-[30px] text-[#2b2b2b] dark:text-white mb-10 capitalize text-center leading-tight font-bold">
          Campus Management System
        </h1>

        <div className="w-full flex bg-[#e2e8f0] dark:bg-slate-800 p-1.5 rounded-2xl mb-10">
          {["Admin", "Faculty", "Student", "Parent"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 py-3 text-base font-bold rounded-xl transition-all duration-200 ${activeTab === tab
                ? "bg-[#3b82f6] text-white shadow-md"
                : "text-[#64748b] dark:text-slate-400 hover:text-[#1e293b] dark:hover:text-white"
                }`}
              onClick={() => {
                setActiveTab(tab);
                setCredentials({ identifier: "", password: "" });
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Parent" ? (
          <div className="w-full flex flex-col items-center justify-center py-12">
            <MdSupervisorAccount size={64} className="text-[#94a3b8] dark:text-slate-500 mb-4" />
            <h2 className="text-[22px] font-bold text-[#2b2b2b] dark:text-white mb-2">Coming Soon</h2>
            <p className="text-[15px] text-[#94a3b8] dark:text-slate-400 text-center leading-relaxed max-w-[320px]">
              Parent portal is under development.<br />
              Stay tuned for updates!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="relative">
              <input
                type="text"
                name="identifier"
                placeholder={
                  activeTab === "Student" ? "Roll Number" :
                    `${activeTab} Username`
                }
                value={credentials.identifier}
                onChange={handleInputChange}
                className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl text-[#2b2b2b] dark:text-white text-[18px] placeholder-[#94a3b8] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                required
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-80">
                {getRoleIcon()}
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleInputChange}
                className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl text-[#2b2b2b] dark:text-white text-[18px] placeholder-[#94a3b8] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-[#94a3b8] dark:text-slate-400 hover:text-[#64748b] dark:hover:text-slate-300"
              >
                {showPassword ? <HiOutlineEyeOff size={24} /> : <HiOutlineEye size={24} />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#3b82f6] text-white py-4 rounded-2xl text-[20px] shadow-lg shadow-blue-100 dark:shadow-none hover:bg-[#2563eb] active:scale-[0.98] transition-all disabled:opacity-70 mt-4 font-bold"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Login"}
            </button>
          </form>
        )}

        {activeTab !== "Parent" && <ForgotPasswordTrigger />}
      </div>

      <footer className="mt-10 text-[15px] text-[#94a3b8] dark:text-slate-500 italic">
        © 2026 Campus Management System
      </footer>
    </div>
  );
}

// ─── Forgot Password Trigger (lazy-loaded modal) ───────────────────────────────
function ForgotPasswordTrigger() {
  const [open, setOpen] = useState(false);
  const [ForgotPassword, setForgotPassword] = useState(null);

  const handleOpen = async () => {
    if (!ForgotPassword) {
      const mod = await import("./ForgotPassword");
      setForgotPassword(() => mod.default);
    }
    setOpen(true);
  };

  return (
    <>
      <div className="mt-10 text-base text-[#64748b] dark:text-slate-400">
        Forgot{" "}
        <span
          id="forgot-password-link"
          className="text-[#3b82f6] font-bold cursor-pointer hover:underline"
          onClick={handleOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleOpen()}
        >
          Password?
        </span>
      </div>

      {open && ForgotPassword && (
        <ForgotPassword onClose={() => setOpen(false)} />
      )}
    </>
  );
}

export default LoginPage;