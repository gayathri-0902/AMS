import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

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
      // Sends role (admin, faculty, student, or parent) to AuthContext
      await login(
        activeTab.toLowerCase(),
        credentials.identifier,
        credentials.password
      );
    } catch (error) {
      alert(error.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      <div className="w-full max-w-[440px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-10 flex flex-col items-center">
        
        {/* LOGO UPDATE: changed to logo.jpeg */}
        <div className="mb-4">
          <img 
            src="/logo.jpeg" 
            alt="AIMSCS Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>

        <h1 className="text-[22px] font-bold text-[#1e293b] mb-8">
          Attendance Hub
        </h1>

        {/* Updated Tab Bar with Parent */}
        <div className="w-full flex bg-[#e2e8f0] p-1.5 rounded-2xl mb-8">
          {["Admin", "Faculty", "Student", "Parent"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#3b82f6] text-white shadow-md"
                  : "text-[#64748b] hover:text-[#1e293b]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
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
            className="w-full px-5 py-4 bg-white border border-[#e2e8f0] rounded-2xl text-gray-700 placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleInputChange}
              className="w-full px-5 py-4 bg-white border border-[#e2e8f0] rounded-2xl text-gray-700 placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
            >
              {showPassword ? <HiOutlineEyeOff size={22} /> : <HiOutlineEye size={22} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-[#3b82f6] text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-blue-100 hover:bg-[#2563eb] active:scale-[0.98] transition-all disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-sm text-[#64748b]">
          Forgot <span className="text-[#3b82f6] font-bold cursor-pointer hover:underline">Password?</span>
        </div>
      </div>

      {/* Corrected year to 2026 */}
      <footer className="mt-8 text-sm text-[#94a3b8] font-medium">
        © 2026 Attendance Hub
      </footer>
    </div>
  );
}

export default LoginPage;