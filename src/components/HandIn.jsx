import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  HiOutlineChevronLeft, 
  HiOutlineClock, 
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineCloudUpload
} from "react-icons/hi";
import { useAuth } from "../context/AuthContext";

const HandIn = () => {
    const { assignmentId } = useParams();
    const { auth } = useAuth();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [driveLink, setDriveLink] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null); // Stores the API response
    const [updatingLink, setUpdatingLink] = useState(false);

    useEffect(() => {
        const fetchAssignmentData = async () => {
            if (!auth?.studentId) return;
            
            try {
                // Fetch the assignment and the student's submission history simultaneously
                const [asmRes, subRes] = await Promise.allSettled([
                    axios.get(`${API_BASE}/api/assignment/${assignmentId}`),
                    axios.get(`${API_BASE}/api/submission/student/${auth.studentId}/assignment/${assignmentId}`)
                ]);

                if (asmRes.status === 'fulfilled') {
                    setAssignment(asmRes.value.data);
                    
                    // If a submission already exists, show the graded state immediately
                    if (subRes.status === 'fulfilled' && subRes.value.data) {
                        setSubmitted(true);
                        setSubmissionResult(subRes.value.data);
                        if (asmRes.value.data.assignment_type !== "mcq") {
                            setDriveLink(subRes.value.data.submission_file_url || "");
                        }
                    } 
                    // Otherwise initialize empty answers for a new attempt
                    else if (asmRes.value.data.assignment_type === "mcq") {
                        setAnswers(asmRes.value.data.questions.map((_, i) => ({
                            question_index: i,
                            student_selected_option: ""
                        })));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch assignment data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignmentData();
    }, [assignmentId, auth?.studentId, API_BASE]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await axios.post(`${API_BASE}/api/submission/submit`, {
                assignment_id: assignmentId,
                student_id: auth.studentId,
                answers: assignment.assignment_type === "mcq" ? answers : [],
                submission_file_url: assignment.assignment_type !== "mcq" ? driveLink : ""
            });
            setSubmissionResult(response.data.submission); // Store full result
            setSubmitted(true);
            // We no longer auto-redirect so the student can review their score or edit their link
        } catch (err) {
            alert(err.response?.data?.error || "Submission failed. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateLink = async () => {
        setUpdatingLink(true);
        try {
            await axios.patch(`${API_BASE}/api/submission/${submissionResult._id}/link`, {
                submission_file_url: driveLink
            });
            setSubmissionResult(prev => ({ ...prev, submission_file_url: driveLink }));
            alert("Link updated successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update link.");
        } finally {
            setUpdatingLink(false);
        }
    };

    const isPastDeadline = assignment && new Date() > new Date(assignment.submission_deadline);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!assignment) return <div>Assignment not found.</div>;

    return (
        <div className="min-h-screen bg-[#f0f2f5] p-6 lg:p-12 font-antiqua">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-10">
                    <Link to={`/student-dashboard/${auth.studentId}`} 
                          className="p-3 bg-white rounded-2xl shadow-sm text-gray-600">
                        <HiOutlineChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
                        <p className="text-gray-500 font-medium">Due: {new Date(assignment.submission_deadline).toLocaleDateString()}</p>
                    </div>
                </div>

                {submitted ? (
                    assignment.assignment_type === "mcq" && submissionResult ? (
                        // MCQ Score Card
                        <div className="bg-white rounded-[40px] p-12 text-center shadow-lg border-t-8 border-blue-500 animate-in zoom-in duration-300">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-black ${
                                (submissionResult.auto_score || 0) >= 80 ? "bg-green-50 text-green-500" :
                                (submissionResult.auto_score || 0) >= 50 ? "bg-yellow-50 text-yellow-500" :
                                "bg-red-50 text-red-500"
                            }`}>
                                {Math.round(submissionResult.auto_score || 0)}%
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-800">Assignment Complete!</h2>
                            <p className="text-gray-500 mt-2 font-medium">
                                You got <span className="font-black text-gray-800">
                                    {submissionResult.answers?.filter(a => a.is_correct).length || 0}
                                </span> out of <span className="font-black text-gray-800">{assignment.questions.length}</span> correct.
                            </p>
                            <div className="mt-8 grid grid-cols-2 gap-3 max-w-xs mx-auto">
                                {submissionResult.answers?.map((ans, i) => (
                                    <div key={i} className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 ${
                                        ans.is_correct ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                                    }`}>
                                        <span>{ans.is_correct ? "✓" : "✗"}</span> Q{i + 1}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => navigate(`/student-dashboard/${auth.studentId}`)}
                                className="mt-10 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-95"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    ) : (
                        // Written/Coding display & update screen
                        <div className="bg-white rounded-[40px] p-12 shadow-lg border-t-8 border-green-500 animate-in zoom-in duration-300">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center">
                                <HiOutlineCheckCircle className="mr-3 text-green-500 w-10 h-10" /> 
                                Submission Received
                            </h2>
                            <div className="mb-8 max-w-xl mx-auto">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-3 text-left">Submitted Drive Link / Repository</label>
                                <div className="flex space-x-4">
                                    <input 
                                        type="url"
                                        value={driveLink}
                                        onChange={(e) => setDriveLink(e.target.value)}
                                        disabled={isPastDeadline}
                                        className="w-full bg-gray-50 text-gray-800 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-medium transition-all"
                                    />
                                    {!isPastDeadline && (
                                        <button 
                                            onClick={handleUpdateLink}
                                            disabled={updatingLink || driveLink === submissionResult?.submission_file_url}
                                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                        >
                                            {updatingLink ? "Saving..." : "Update Link"}
                                        </button>
                                    )}
                                </div>
                                {isPastDeadline && (
                                    <p className="mt-4 text-orange-500 text-sm font-bold flex items-center justify-center">
                                        <HiOutlineClock className="mr-1" /> Deadline has passed. Edits are disabled.
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => navigate(`/student-dashboard/${auth.studentId}`)}
                                className="mt-4 px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    )
                ) : (
                    <div className="space-y-8">
                        {/* Instructions Card */}
                        <div className="bg-white rounded-[40px] p-8 shadow-sm border-l-8 border-blue-500">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <HiOutlineDocumentText className="mr-2 text-blue-500" /> Instructions
                            </h3>
                            <p className="text-gray-600 leading-relaxed font-medium">
                                {assignment.instructions}
                            </p>
                        </div>

                        {/* MCQ Section */}
                        {assignment.assignment_type === "mcq" && (
                            <div className="space-y-6">
                                {assignment.questions.map((q, qIdx) => (
                                    <div key={qIdx} className="bg-white rounded-[32px] p-8 shadow-sm group transition-all">
                                        <div className="flex items-start space-x-4 mb-6">
                                            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                                                {qIdx + 1}
                                            </span>
                                            <p className="text-lg font-bold text-gray-800 leading-snug">{q.question_text}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                                            {q.options.map((opt, oIdx) => (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => {
                                                        const newArr = [...answers];
                                                        newArr[qIdx].student_selected_option = opt;
                                                        setAnswers(newArr);
                                                    }}
                                                    className={`p-5 rounded-2xl border-2 text-left font-bold transition-all ${answers[qIdx]?.student_selected_option === opt ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-4 ring-blue-50" : "border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-200"}`}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Written/Coding Questions Display */}
                        {assignment.assignment_type !== "mcq" && assignment.questions && assignment.questions.length > 0 && (
                            <div className="space-y-6">
                                {assignment.questions.map((q, qIdx) => (
                                    <div key={qIdx} className="bg-white rounded-[32px] p-8 shadow-sm group transition-all border border-gray-100 border-l-8 border-l-blue-500">
                                        <div className="flex items-start space-x-4">
                                            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                                                {qIdx + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-lg font-bold text-gray-800 leading-snug">{q.question_text}</p>
                                                {assignment.assignment_type === "coding" && q.starter_code && (
                                                    <div className="mt-4 bg-[#1E1E1E] rounded-2xl p-4 overflow-x-auto shadow-inner">
                                                        <pre className="text-sm text-green-400 font-mono">
                                                            <code>{q.starter_code}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Written/Coding Submission Section */}
                        {assignment.assignment_type !== "mcq" && (
                            <div className="bg-white rounded-[40px] p-10 shadow-sm text-center border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <HiOutlineCloudUpload size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Submission</h3>
                                <p className="text-gray-500 mb-8 font-medium italic">Paste your Google Drive or Repository link below</p>
                                <input 
                                    type="url"
                                    placeholder="https://drive.google.com/..."
                                    value={driveLink}
                                    onChange={(e) => setDriveLink(e.target.value)}
                                    className="w-full max-w-lg mx-auto px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-center font-medium"
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        {!isPastDeadline ? (
                            <button
                                disabled={submitting || (assignment.assignment_type === "mcq" ? answers.some(a => !a.student_selected_option) : !driveLink)}
                                onClick={handleSubmit}
                                className={`w-full py-6 rounded-[32px] text-xl font-black shadow-2xl transition-all active:scale-95 ${submitting ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                                {submitting ? "Processing Hand-in..." : "Submit Assignment"}
                            </button>
                        ) : (
                            <div className="w-full py-6 rounded-[32px] text-xl font-black shadow-lg bg-red-50 text-red-500 flex items-center justify-center">
                                <HiOutlineClock className="mr-2 w-6 h-6" /> MISSED DEADLINE
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HandIn;
