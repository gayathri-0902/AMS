import React, { useState } from "react";
import axios from "axios";
import { HiOutlineMail } from "react-icons/hi";
import { MdOutlineArrowBack } from "react-icons/md";

const API = import.meta.env.VITE_API_BASE_URL;
// Strict pattern: letters/digits/dots before @, exact domain
const COLLEGE_EMAIL_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.]*@crraoaimscs\.res\.in$/;
const COLLEGE_DOMAIN = "@crraoaimscs.res.in"; // for placeholder display

// ─── Step 1: Email Entry ──────────────────────────────────────────────────────
function StepEmail({ onLinkSent, onClose }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (val) => {
    if (!val) return "Email is required.";
    if (!COLLEGE_EMAIL_REGEX.test(val))
      return `${COLLEGE_DOMAIN}).`;
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(email.trim());
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email: email.trim() });
      onLinkSent(email.trim());
    } catch (ex) {
      setError(ex.response?.data?.message || "Failed to send reset link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="fp-form">
      <div className="fp-icon-wrap fp-blue">
        <HiOutlineMail size={30} />
      </div>
      <h2 className="fp-title">Forgot Password?</h2>
      <p className="fp-subtitle">
        Enter your college email address.<br />
        We'll send a password reset link to your inbox.
      </p>

      <div className="fp-field">
        <label className="fp-label">College Email</label>
        <input
          id="fp-email-input"
          type="email"
          className={`fp-input ${error ? "fp-input-error" : ""}`}
          placeholder={`name or rollno${COLLEGE_DOMAIN}`}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          autoFocus
        />
        <span className="fp-domain-hint">{COLLEGE_DOMAIN}</span>
        {error && <p className="fp-error">{error}</p>}
      </div>

      <div className="fp-actions">
        <button type="button" className="fp-btn-ghost" onClick={onClose}>
          <MdOutlineArrowBack size={18} /> Back to Login
        </button>
        <button type="submit" className="fp-btn-primary" disabled={loading}>
          {loading ? <span className="fp-spinner" /> : "Send Link"}
        </button>
      </div>
    </form>
  );
}

// ─── Step 2: Link Sent Confirmation ───────────────────────────────────────────
function StepLinkSent({ email, onClose }) {
  return (
    <div className="fp-form fp-success-wrap">
      <div className="fp-success-anim">
        <svg viewBox="0 0 52 52" className="fp-checkmark">
          <circle className="fp-checkmark-circle" cx="26" cy="26" r="25" fill="none" />
          <path className="fp-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      </div>
      <h2 className="fp-title">Check Your Email</h2>
      <p className="fp-subtitle">
        A password reset link has been sent to<br />
        <strong className="fp-email-chip">{email}</strong>
        <br /><br />
        The link is valid for <strong>15 minutes</strong>.<br />
        Click it to set a new password.
      </p>
      <p className="fp-spam-note">
        Can't find it? Check your spam/junk folder.
      </p>
      <button className="fp-btn-primary fp-btn-full" onClick={onClose}>
        Back to Login
      </button>
    </div>
  );
}

// ─── Main Modal Shell ─────────────────────────────────────────────────────────
export default function ForgotPassword({ onClose }) {
  const [step, setStep] = useState("email"); // email | sent
  const [email, setEmail] = useState("");

  return (
    <>
      {/* Inline styles so this component is self-contained */}
      <style>{`
        .fp-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: fp-fade-in 0.2s ease;
        }
        @keyframes fp-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .fp-card {
          background: #fff;
          border-radius: 28px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          padding: 40px 36px 32px;
          width: 100%; max-width: 440px;
          position: relative;
          animation: fp-slide-up 0.28s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes fp-slide-up {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        :is(.dark) .fp-card {
          background: #1e293b;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }

        .fp-close {
          position: absolute; top: 16px; right: 16px;
          background: #f1f5f9; border: none; border-radius: 50%;
          width: 32px; height: 32px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #64748b; font-size: 18px;
          transition: background 0.15s;
        }
        .fp-close:hover { background: #e2e8f0; }
        :is(.dark) .fp-close { background: #334155; color: #94a3b8; }
        :is(.dark) .fp-close:hover { background: #475569; }

        .fp-form { display: flex; flex-direction: column; align-items: center; gap: 0; }

        .fp-icon-wrap {
          width: 64px; height: 64px; border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }
        .fp-blue { background: #dbeafe; color: #2563eb; }
        :is(.dark) .fp-blue { background: #1e3a5f; color: #60a5fa; }

        .fp-title {
          font-size: 22px; font-weight: 800;
          color: #1e293b; margin: 0 0 8px; text-align: center;
        }
        :is(.dark) .fp-title { color: #f1f5f9; }

        .fp-subtitle {
          font-size: 14px; color: #64748b;
          text-align: center; margin: 0 0 24px; line-height: 1.6;
        }
        :is(.dark) .fp-subtitle { color: #94a3b8; }

        .fp-email-chip {
          display: inline-block; margin-top: 4px;
          background: #eff6ff; color: #2563eb;
          border-radius: 8px; padding: 2px 10px;
          font-size: 13px;
        }
        :is(.dark) .fp-email-chip { background: #1e3a5f; color: #60a5fa; }

        .fp-spam-note {
          font-size: 12px; color: #94a3b8;
          text-align: center; margin: 0 0 20px;
        }

        .fp-field { width: 100%; margin-bottom: 16px; position: relative; }
        .fp-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
        :is(.dark) .fp-label { color: #94a3b8; }

        .fp-input {
          width: 100%; padding: 13px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px; font-size: 15px;
          color: #1e293b; background: #f8fafc;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .fp-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .fp-input-error { border-color: #ef4444 !important; }
        :is(.dark) .fp-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
        :is(.dark) .fp-input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,0.12); }

        .fp-domain-hint {
          position: absolute; right: 14px; top: 38px;
          font-size: 12px; color: #94a3b8; pointer-events: none;
        }

        .fp-error { color: #ef4444; font-size: 13px; margin-top: 6px; }

        /* Action row */
        .fp-actions {
          display: flex; gap: 12px; width: 100%; margin-top: 8px;
        }
        .fp-btn-ghost {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 13px; border-radius: 14px;
          background: #f1f5f9; color: #64748b;
          border: none; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .fp-btn-ghost:hover { background: #e2e8f0; }
        :is(.dark) .fp-btn-ghost { background: #334155; color: #94a3b8; }
        :is(.dark) .fp-btn-ghost:hover { background: #475569; }

        .fp-btn-primary {
          flex: 2; padding: 13px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff; border: none; border-radius: 14px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center;
        }
        .fp-btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .fp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .fp-btn-full { flex: 1; margin-top: 4px; }

        /* Spinner */
        .fp-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: fp-spin 0.7s linear infinite;
        }
        @keyframes fp-spin { to { transform: rotate(360deg); } }

        /* Success */
        .fp-success-wrap { gap: 0; }
        .fp-success-anim { margin-bottom: 20px; }
        .fp-checkmark {
          width: 72px; height: 72px;
          border-radius: 50%;
        }
        .fp-checkmark-circle {
          stroke: #22c55e; stroke-width: 2;
          stroke-dasharray: 166; stroke-dashoffset: 166;
          animation: fp-stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards;
        }
        .fp-checkmark-check {
          stroke: #22c55e; stroke-width: 2.5;
          stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 48; stroke-dashoffset: 48;
          animation: fp-stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.55s forwards;
        }
        @keyframes fp-stroke {
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="fp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="fp-card" role="dialog" aria-modal="true" aria-label="Forgot Password">
          {step !== "sent" && (
            <button className="fp-close" onClick={onClose} aria-label="Close">✕</button>
          )}

          {step === "email" && (
            <StepEmail
              onLinkSent={(sentEmail) => { setEmail(sentEmail); setStep("sent"); }}
              onClose={onClose}
            />
          )}

          {step === "sent" && (
            <StepLinkSent email={email} onClose={onClose} />
          )}
        </div>
      </div>
    </>
  );
}
