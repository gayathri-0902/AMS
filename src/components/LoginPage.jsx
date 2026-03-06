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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5] p-6 font-antiqua">
      <div className="w-full max-w-[520px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-[32px] p-12 flex flex-col items-center">
        
        <div className="mb-6">
          <img 
            src="/logo.jpeg" 
            alt="AIMSCS Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>

        <h1 className="text-[30px] text-[#2b2b2b] mb-10 capitalize text-center leading-tight">
          Attendance Management System
        </h1>

        <div className="w-full flex bg-[#e2e8f0] p-1.5 rounded-2xl mb-10">
          {["Admin", "Faculty", "Student", "Parent"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 py-3 text-base font-bold rounded-xl transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#3b82f6] text-white shadow-md"
                  : "text-[#64748b] hover:text-[#1e293b]"
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

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="relative">
            <input
              type="text"
              name="identifier"
              placeholder={
                activeTab === "Student" ? "Roll Number" : 
                activeTab === "Parent" ? "Registered Email" : 
                `${activeTab} Username`
              }
              value={credentials.identifier}
              onChange={handleInputChange}
              className="w-full px-6 py-4 bg-white border border-[#e2e8f0] rounded-2xl text-[#2b2b2b] text-[18px] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
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
              className="w-full px-6 py-4 bg-white border border-[#e2e8f0] rounded-2xl text-[#2b2b2b] text-[18px] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
            >
              {showPassword ? <HiOutlineEyeOff size={24} /> : <HiOutlineEye size={24} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-[#3b82f6] text-white py-4 rounded-2xl text-[20px] shadow-lg shadow-blue-100 hover:bg-[#2563eb] active:scale-[0.98] transition-all disabled:opacity-70 mt-4"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <div className="mt-10 text-base text-[#64748b]">
          Forgot <span className="text-[#3b82f6] font-bold cursor-pointer hover:underline">Password?</span>
        </div>
      </div>

      <footer className="mt-10 text-[15px] text-[#94a3b8] italic">
        © 2026 Campus Management System
      </footer>
    </div>
  );
}

export default LoginPage;