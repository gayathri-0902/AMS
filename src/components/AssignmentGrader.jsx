import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineChevronLeft,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
  HiOutlineAcademicCap,
  HiOutlineClipboardList,
} from "react-icons/hi";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Score Badge ─────────────────────────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const pct = Math.round(score);
  const color =
    pct >= 80 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" :
    pct >= 50 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-600";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black ${color}`}>
      {pct}%
    </span>
  );
};

// ─── Grading Form (Written / Coding) ─────────────────────────────────────────
const GradingForm = ({ submission, onGraded }) => {
  const [grade, setGrade] = useState(submission.manual_grade || "");
  const [feedback, setFeedback] = useState(submission.faculty_feedback || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(
        `${API_BASE}/api/submission/${submission._id}/grade`,
        { manual_grade: grade, faculty_feedback: feedback }
      );
      onGraded(submission._id, grade, feedback);
    } catch (err) {
      alert("Failed to save grade.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-600 space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Grade (e.g. A, 8/10)"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-transparent rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
        />
        <button
          onClick={handleSave}
          disabled={saving || !grade}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-all active:scale-95"
        >
          {saving ? "Saving..." : "Save Grade"}
        </button>
      </div>
      <textarea
        placeholder="Feedback for student (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-transparent rounded-xl text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
      />
    </div>
  );
};

// ─── Main Grader Component ────────────────────────────────────────────────────
const AssignmentGrader = () => {
  const { assignmentId } = useParams();
  const { auth } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build back URL only once the assignment is loaded so we know the subjectId
  const backUrl = assignment
    ? `/faculty-dashboard/${auth?.facultyId}?selectClass=${assignment.subject_offering_id?._id || assignment.subject_offering_id}`
    : `/faculty-dashboard/${auth?.facultyId}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          axios.get(`${API_BASE}/api/assignment/${assignmentId}`),
          axios.get(`${API_BASE}/api/submission/assignment/${assignmentId}`),
        ]);
        setAssignment(aRes.data);
        setSubmissions(sRes.data);
      } catch (err) {
        console.error("Failed to load grader data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  const handleGraded = (submissionId, grade, feedback) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s._id === submissionId
          ? { ...s, manual_grade: grade, faculty_feedback: feedback, status: "Graded" }
          : s
      )
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );

  if (!assignment) return <div className="p-10 text-gray-500 dark:text-slate-400 dark:text-slate-500">Assignment not found.</div>;

  const isMCQ = assignment.assignment_type === "mcq";
  const gradedCount = submissions.filter((s) => s.status === "Graded").length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 p-6 lg:p-10 font-antiqua">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Link
            to={backUrl}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-gray-500 dark:text-slate-400 dark:text-slate-500 hover:text-gray-800 dark:text-white transition-colors mt-1"
          >
            <HiOutlineChevronLeft size={22} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                isMCQ ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" :
                assignment.assignment_type === "coding" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 dark:text-purple-300 dark:text-purple-400" :
                "bg-orange-50 text-orange-600"
              }`}>
                {assignment.assignment_type}
              </span>
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gray-100 text-gray-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {assignment.assignment_mode?.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{assignment.title}</h1>
            <p className="text-sm text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1 font-medium">
              Due: {new Date(assignment.submission_deadline).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
              })}
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Submissions", value: submissions.length, icon: HiOutlineClipboardList, color: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40" },
            { label: "Graded", value: gradedCount, icon: HiOutlineCheckCircle, color: "text-green-500 bg-green-50 dark:bg-green-900/20" },
            { label: "Pending", value: submissions.length - gradedCount, icon: HiOutlineDocumentText, color: "text-yellow-500 bg-yellow-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-[28px] p-5 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800 dark:text-white">{value}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Assignment Questions (MCQ only — faculty reference) */}
        {isMCQ && assignment.questions.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm mb-6">
            <h2 className="text-sm font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <HiOutlineAcademicCap /> Answer Key
            </h2>
            <div className="space-y-3">
              {assignment.questions.map((q, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-black text-xs shrink-0">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-slate-200">{q.question_text}</p>
                    <p className="text-green-600 dark:text-green-400 font-bold mt-0.5">✓ {q.correct_answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submissions List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest border-l-4 border-blue-500 pl-3">
            Student Submissions ({submissions.length})
          </h2>

          {submissions.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-10 text-center shadow-sm">
              <p className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold">No submissions yet.</p>
            </div>
          )}

          {submissions.map((sub) => {
            const student = sub.student_id;
            const isGraded = sub.status === "Graded";

            return (
              <div
                key={sub._id}
                className={`bg-white dark:bg-slate-800 rounded-[28px] p-6 shadow-sm border-l-4 transition-all ${
                  isGraded ? "border-green-400" : "border-gray-100 dark:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                      <HiOutlineUser size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {student?.name || student?.student_name || "Unknown Student"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold">
                        {student?.roll_no || ""}
                        {" · "}
                        Submitted {new Date(sub.hand_in_date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isGraded && (
                      <span className="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">GRADED</span>
                    )}
                    {isMCQ && sub.auto_score !== undefined && (
                      <ScoreBadge score={sub.auto_score} />
                    )}
                    {!isMCQ && sub.manual_grade && (
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 rounded-full text-xs font-black">
                        {sub.manual_grade}
                      </span>
                    )}
                  </div>
                </div>

                {/* MCQ Answer Breakdown */}
                {isMCQ && sub.answers?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-700">
                    <p className="text-xs text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold mb-3 uppercase tracking-widest">Answer Breakdown</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {sub.answers.map((ans, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
                            ans.is_correct ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-600"
                          }`}
                        >
                          <span>{ans.is_correct ? "✓" : "✗"}</span>
                          <span>Q{i + 1}: {ans.student_selected_option || "—"}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-gray-600 dark:text-slate-300 mt-3">
                      Score: {sub.answers.filter((a) => a.is_correct).length}/{sub.answers.length}
                      {" "}({Math.round(sub.auto_score)}%)
                    </p>
                  </div>
                )}

                {/* Written/Coding: Drive Link */}
                {!isMCQ && sub.submission_file_url && (
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-700">
                    <a
                      href={sub.submission_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
                    >
                      <HiOutlineExternalLink size={16} />
                      View Submission
                    </a>
                  </div>
                )}

                {/* Manual Grading Form (Written / Coding) */}
                {!isMCQ && (
                  <GradingForm submission={sub} onGraded={handleGraded} />
                )}

                {/* Faculty Feedback Display (if already graded) */}
                {sub.faculty_feedback && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 dark:text-slate-500 italic bg-gray-50 dark:bg-slate-700 rounded-xl px-4 py-2">
                    "{sub.faculty_feedback}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssignmentGrader;
