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
    <div className="mb-5">
      <p className="font-medium mb-2">{label}</p>
      <div className="flex gap-6">
        {[1, 2, 3, 4, 5].map((num) => (
          <label key={num} className="flex items-center gap-1">
            <input
              type="radio"
              name={name}
              value={num}
              checked={form[name] === num}
              onChange={() => handleChange(name, num)}
              required
            />
            {num}
          </label>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center font-bold">Loading session...</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow rounded my-10 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-slate-800 mb-2 text-center uppercase tracking-tight">
        {activePhase} Feedback
      </h1>
      <p className="text-slate-500 text-center mb-10 font-medium italic">
        Please provide your honest feedback for this course.
      </p>

      <Rating label="1. Faculty regularity in taking classes" name="regularity" />
      <Rating label="2. Interaction with students" name="interaction" />
      <Rating label="3. Clarity of explanation" name="explanation" />
      <Rating label="4. Quality of learning resources" name="resources" />
      <Rating label="5. Student counselling & follow-up" name="counselling" />
      <Rating label="6. Remedial measures for weak students" name="remedial" />
      <Rating label="7. Syllabus alignment with R22" name="syllabus_alignment" />
      <Rating label="8. Pace of syllabus coverage" name="pace" />

      <textarea
        className="w-full border rounded p-3 mt-4"
        placeholder="Additional comments (optional)"
        value={form.comments}
        onChange={(e) =>
          setForm({ ...form, comments: e.target.value })
        }
      />

      <button
        onClick={submitFeedback}
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded"
      >
        Submit Feedback
      </button>
    </div>
  );
}

export default FeedbackPage;
