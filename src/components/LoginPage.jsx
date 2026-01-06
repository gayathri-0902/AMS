import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react"; // You may need to install lucide-react

function LoginPage() {
  const [activeTab, setActiveTab] = useState("Faculty");
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(
        activeTab.toLowerCase(),
        credentials.identifier,
        credentials.password
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dee2e6] font-sans">
      <div className="w-full max-w-[450px] bg-white shadow-xl rounded-[24px] p-10 flex flex-col items-center">
        
        {/* Logo Section */}
        <div className="mb-4">
          <img 
            src="/src/logo.png" // Replace with your actual logo path
            alt="AIMSCS Logo" 
            className="h-24 w-auto object-contain"
          />
        </div>

        <h1 className="text-[#334155] text-2xl font-medium mb-8">
          Attendance Hub
        </h1>

        {/* Tab Switcher - Pill Style */}
        <div className="w-full flex bg-[#f1f3f5] rounded-xl p-1 mb-8">
          {["Admin", "Faculty", "Student"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#3b82f6] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#334155]"
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

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Identifier Input */}
          <input
            type="text"
            name="identifier"
            placeholder={
              activeTab === "Student" 
                ? "Roll Number" 
                : `${activeTab} Username`
            }
            value={credentials.identifier}
            onChange={handleInputChange}
            className="w-full px-5 py-4 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-[#adb5bd]"
            required
          />

          {/* Password Input with Visibility Toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleInputChange}
              className="w-full px-5 py-4 bg-[#f8f9fa] border border-[#e9ecef] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-[#adb5bd]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-[#64748b]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-[#3b82f6] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#2563eb] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-sm text-[#64748b]">
          Forgot <button className="text-[#3b82f6] hover:underline">Password</button>?
        </div>

        <div className="mt-12 text-[#adb5bd] text-xs">
          © 2025 Attendance Hub
        </div>
      </div>
    </div>
  );
}

export default LoginPage;