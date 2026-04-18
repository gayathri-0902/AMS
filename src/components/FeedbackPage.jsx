import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FeedbackPage() {
  const { subjectOfferingId } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [activePhase, setActivePhase] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    regularity: null,
    interaction: null,
    explanation: null,
    resources: null,
    counselling: null,
    remedial: null,
    syllabus_alignment: null,
    pace: null,
    comments: "",
  });

  useState(() => {
    const fetchPhase = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/feedback/eligibility/${auth.studentId}`);
        if (res.data.activePhase) {
          setActivePhase(res.data.activePhase);
        } else {
          alert("No active feedback session found for your batch.");
          navigate(-1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (auth?.studentId) fetchPhase();
  }, [auth?.studentId]);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const submitFeedback = async () => {
    if (!activePhase) return alert("Feedback session expired or not found.");

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/feedback`,
        {
          student_id: auth.studentId,
          subject_offering_id: subjectOfferingId,
          feedback_type: activePhase,
          ...form,
        }
      );

      alert(`${activePhase} Feedback submitted successfully`);
      navigate(`/student-dashboard/${auth.studentId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting feedback");
    }
  };

  const Rating = ({ label, name }) => (
    <div className="mb-6 group">
      <p className="font-bold text-slate-800 dark:text-slate-200 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {label}
      </p>
      <div className="flex flex-wrap gap-4 md:gap-8">
        {[1, 2, 3, 4, 5].map((num) => (
          <label key={num} className="flex items-center gap-2 cursor-pointer group/label">
            <input
              type="radio"
              name={name}
              value={num}
              checked={form[name] === num}
              onChange={() => handleChange(name, num)}
              className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 transition-all"
              required
            />
            <span className="text-sm font-black text-slate-600 dark:text-slate-400 group-hover/label:text-blue-500 transition-colors">
              {num}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-antiqua">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold text-slate-500 dark:text-slate-400">Syncing Session...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 font-antiqua">
      <div className="max-w-3xl mx-auto p-8 md:p-12 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-100 dark:border-blue-800/50">
            Active Session: {activePhase}
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight uppercase">
            {activePhase} Feedback
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">
            Your honest evaluation helps us improve the quality of education.
          </p>
        </div>

        <div className="space-y-8">
          <Rating label="1. Faculty regularity in taking classes" name="regularity" />
          <Rating label="2. Interaction with students" name="interaction" />
          <Rating label="3. Clarity of explanation" name="explanation" />
          <Rating label="4. Quality of learning resources" name="resources" />
          <Rating label="5. Student counselling & follow-up" name="counselling" />
          <Rating label="6. Remedial measures for weak students" name="remedial" />
          <Rating label="7. Syllabus alignment with R22" name="syllabus_alignment" />
          <Rating label="8. Pace of syllabus coverage" name="pace" />
        </div>

        <div className="mt-10">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-3">Additional Comments</p>
          <textarea
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
            rows="4"
            placeholder="Tell us more about your experience..."
            value={form.comments}
            onChange={(e) =>
              setForm({ ...form, comments: e.target.value })
            }
          />
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            DISCARD
          </button>
          <button
            onClick={submitFeedback}
            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
          >
            SUBMIT FEEDBACK
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;
