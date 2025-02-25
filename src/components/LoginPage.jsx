import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [activeTab, setActiveTab] = useState("Faculty");
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

    if (!credentials.identifier || !credentials.password) {
      alert("Please fill in both fields");
      setLoading(false);
      return;
    }

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-semibold text-center text-gray-700 mb-6">
          {activeTab} Login
        </h1>

        <div className="flex justify-around mb-6">
          {["Admin", "Faculty", "Student"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "Student" ? (
            <input
              type="text"
              name="identifier"
              placeholder="Roll Number"
              value={credentials.identifier}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          ) : (
            <input
              type="text"
              name="identifier"
              placeholder={
                activeTab === "Faculty" ? "Faculty Username" : "Admin Username"
              }
              value={credentials.identifier}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 focus:outline-none"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
