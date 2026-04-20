import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  HiOutlineChevronLeft,
  HiOutlineSparkles,
  HiOutlineClipboardList,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { useAuth } from "../context/AuthContext";

const AssignmentHub = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const subjectId = queryParams.get("subjectId");

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // State
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [posting, setPosting] = useState(false);
  const [config, setConfig] = useState({
    year: "4",
    branch: "CSDS",
    title: "",
    instructions: "",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Default 1 week
  });
  const [result, setResult] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setProgress("Connecting...");

    // Frontend validation
    if (!config.title || !config.title.trim()) {
      setError("Please enter an assignment title");
      setLoading(false);
      return;
    }
    if (!config.instructions || !config.instructions.trim()) {
      setError("Please enter assignment instructions/requirements");
      setLoading(false);
      return;
    }
    if (!config.year) {
      setError("Please select an academic year");
      setLoading(false);
      return;
    }
    if (!config.branch) {
      setError("Please select a branch");
      setLoading(false);
      return;
    }

    try {
      const requestBody = {
        faculty_id: auth.facultyId,
        subject_offering_id: subjectId,
        title: config.title || "New Assignment",
        instructions: config.instructions.trim(),
        year: parseInt(config.year),
        branch: config.branch.trim(),
      };
      console.log("Sending request with body:", requestBody);

      const response = await fetch(`${API_BASE}/api/assignment/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // If not ok, try to read error message from response body
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines[lines.length - 1]; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)); // Remove "data: " prefix

              if (data.status === "started") {
                setProgress("Starting assignment generation...");
              } else if (data.status === "progress") {
                setProgress(data.message || `Processing: ${data.step}`);
              } else if (data.status === "complete") {
                setResult(data.assignment);
                setMetadata(data.metadata);
                setProgress(null);
                setLoading(false);
              } else if (data.status === "error") {
                throw new Error(data.message || "Unknown error occurred");
              }
            } catch (parseError) {
              console.error("Error parsing SSE message:", parseError, line);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.message || "Failed to generate assignment. Please try again.",
      );
      setLoading(false);
      setProgress(null);
    }
  };

  const handlePost = async () => {
    setPosting(true);
    setError(null);
    setProgress("Publishing to class...");

    try {
      if (!result) throw new Error("No assignment generated yet to publish.");

      const response = await fetch(`${API_BASE}/api/assignment/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faculty_id: auth.facultyId,
          subject_offering_id: subjectId,
          title: config.title,
          instructions: config.instructions,
          due_date: config.due_date,
          assignment: result,
          metadata: metadata
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to post assignment.");
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/faculty-dashboard/${auth.facultyId}?selectClass=${subjectId}`);
      }, 1500);
    } catch (err) {
      setError("Failed to post assignment: " + err.message);
      setPosting(false);
      setProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 p-6 lg:p-12 font-antiqua relative">
      {/* Success Popup Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white ring-4 ring-green-50">
              <HiOutlineCheckCircle size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-2 text-center">Successfully Published!</h3>
            <p className="text-gray-500 dark:text-slate-400 dark:text-slate-500 font-medium text-center mb-6">Navigating to dashboard...</p>
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
               <div className="bg-green-50 dark:bg-green-900/200 h-1.5 rounded-full animate-[progress_1.5s_ease-in-out]" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to={`/faculty-dashboard/${auth.facultyId}?selectClass=${subjectId}`}
              className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all text-gray-600 dark:text-slate-300"
            >
              <HiOutlineChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Assignment Hub
              </h1>
              <p className="text-gray-500 dark:text-slate-400 dark:text-slate-500 font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest text-xs">
                AI-Powered Creation Studio
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border-t-8 border-blue-500 border-x border-b border-gray-100 dark:border-slate-600">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <HiOutlineClipboardList className="mr-2 text-blue-500 dark:text-blue-400" />{" "}
                Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Academic Year
                  </label>
                  <select
                    value={config.year}
                    onChange={(e) =>
                      setConfig({ ...config, year: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Branch
                  </label>
                  <select
                    value={config.branch}
                    onChange={(e) =>
                      setConfig({ ...config, branch: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  >
                    <option value="CSDS">Data Science</option>
                    <option value="CSE">Computer Science</option>
                    <option value="CSAIML">AI &amp; ML</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Submission Deadline
                  </label>
                  <input
                    type="date"
                    value={config.due_date}
                    onChange={(e) =>
                      setConfig({ ...config, due_date: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 transition-all text-gray-500 dark:text-slate-400 dark:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 p-6 rounded-3xl flex items-start space-x-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <HiOutlineExclamationCircle
                  size={24}
                  className="mt-0.5 shrink-0"
                />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Right Panel: Workspace */}
          <div className="lg:col-span-8 space-y-8">
            {!result ? (
              <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 lg:p-12 shadow-sm border-x border-b border-gray-100 dark:border-slate-600 min-h-[500px] flex flex-col justify-center">
                <div className="max-w-lg mx-auto w-full space-y-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <HiOutlineSparkles
                        size={40}
                        className={loading ? "animate-spin" : ""}
                      />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Brief the AI Agent
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 dark:text-slate-500 mt-2 font-medium">
                      Explain your requirements in natural language.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Assignment Title (e.g. Midterm Quiz - Statistics)"
                      value={config.title}
                      onChange={(e) =>
                        setConfig({ ...config, title: e.target.value })
                      }
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-700 border border-transparent rounded-2xl outline-none focus:bg-white dark:bg-slate-800 focus:border-blue-200 dark:border-blue-700 focus:ring-4 focus:ring-blue-50 transition-all text-lg font-medium"
                    />
                    <textarea
                      rows="6"
                      placeholder="Example: Give me 10 medium difficulty MCQs on Linear Regression covering coefficients and residual analysis. Use clear language."
                      value={config.instructions}
                      onChange={(e) =>
                        setConfig({ ...config, instructions: e.target.value })
                      }
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-700 border border-transparent rounded-2xl outline-none focus:bg-white dark:bg-slate-800 focus:border-blue-200 dark:border-blue-700 focus:ring-4 focus:ring-blue-50 transition-all text-lg font-medium resize-none"
                    ></textarea>
                  </div>

                  <button
                    disabled={loading || !config.instructions || !config.title}
                    onClick={handleGenerate}
                    className={`w-full py-5 rounded-3xl text-xl font-bold flex items-center justify-center space-x-3 transition-all ${loading ? "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 cursor-not-allowed" : "bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-95"}`}
                  >
                    {loading ? (
                      <>
                        <div className="w-6 h-6 border-4 border-gray-300 dark:border-slate-500 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="flex flex-col items-start">
                          <span>Analyzing Curriculum...</span>
                          {progress && (
                            <span className="text-xs text-gray-500 dark:text-slate-400 dark:text-slate-500 mt-1">
                              {progress}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <HiOutlineSparkles size={24} />
                        <span>Initialize Generation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 lg:p-12 shadow-sm border-x border-b border-gray-100 dark:border-slate-600 animate-in zoom-in duration-500">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50 dark:border-slate-700">
                  <div>
                    <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                      Generation Complete
                    </span>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                      {result.topic || config.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setResult(null);
                      setMetadata(null);
                    }}
                    className="text-blue-500 dark:text-blue-400 font-bold text-xs uppercase border-b-2 border-blue-500 hover:text-blue-600 dark:text-blue-400 tracking-widest"
                  >
                    Create New
                  </button>
                </div>

                <div className="space-y-8">
                  {result.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-8 bg-gray-50 dark:bg-slate-700 rounded-[32px] border border-gray-100 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-600 dark:border-blue-700 transition-all group"
                    >
                      <div className="flex items-start space-x-4 mb-4">
                        <span className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm rounded-xl flex items-center justify-center font-bold text-blue-500 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-800">
                          {idx + 1}
                        </span>
                        <p className="text-lg font-bold text-gray-800 dark:text-white leading-snug">
                          {q.question_text}
                        </p>
                      </div>

                      {idx === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-14">
                          {q.options?.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-4 rounded-2xl border text-sm font-medium ${opt === q.correct_answer ? "bg-green-50 dark:bg-green-900/20 border-green-200 text-green-700 dark:text-green-400" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-600 text-gray-600 dark:text-slate-300"}`}
                            >
                              {opt === q.correct_answer && "✓ "}
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex justify-center">
                  <button
                    disabled={posting}
                    onClick={handlePost}
                    className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-3 active:scale-95"
                  >
                    {posting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineCheckCircle size={24} />
                        <span>Post to Class</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHub;
