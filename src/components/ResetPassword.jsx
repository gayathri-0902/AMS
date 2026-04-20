import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If no token in URL, show invalid state immediately
  const isInvalidToken = !token;

  const validate = () => {
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, newPassword: password });
      setSuccess(true);
    } catch (ex) {
      setError(ex.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect to login after success — clear any existing session first
  useEffect(() => {
    if (success) {
      logout(); // Clear any active session so PublicRoute shows login page
      const timer = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate, logout]);

  return (
    <>
      <style>{`
        .rp-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
          padding: 24px;
        }
        :is(.dark) .rp-page {
          background: linear-gradient(135deg, #0f172a 0%, #0c1a0e 100%);
        }

        .rp-card {
          background: #fff;
          border-radius: 28px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.12);
          padding: 48px 40px 40px;
          width: 100%; max-width: 440px;
          animation: rp-slide-up 0.3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes rp-slide-up {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        :is(.dark) .rp-card {
          background: #1e293b;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }

        .rp-icon-wrap {
          width: 68px; height: 68px; border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          background: #ede9fe; color: #7c3aed;
        }
        :is(.dark) .rp-icon-wrap { background: #3b1a6b; color: #a78bfa; }

        .rp-title {
          font-size: 24px; font-weight: 800;
          color: #1e293b; text-align: center; margin: 0 0 8px;
        }
        :is(.dark) .rp-title { color: #f1f5f9; }

        .rp-subtitle {
          font-size: 14px; color: #64748b;
          text-align: center; margin: 0 0 32px; line-height: 1.6;
        }
        :is(.dark) .rp-subtitle { color: #94a3b8; }

        .rp-field { margin-bottom: 18px; }
        .rp-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
        :is(.dark) .rp-label { color: #94a3b8; }

        .rp-pw-wrap { position: relative; }
        .rp-input {
          width: 100%; padding: 13px 44px 13px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px; font-size: 15px;
          color: #1e293b; background: #f8fafc;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .rp-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        .rp-input-error { border-color: #ef4444 !important; }
        :is(.dark) .rp-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
        :is(.dark) .rp-input:focus { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(167,139,250,0.12); }

        .rp-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; display: flex;
        }
        .rp-eye:hover { color: #64748b; }

        .rp-error {
          color: #ef4444; font-size: 13px;
          margin-top: 10px; text-align: center;
          background: #fef2f2; border-radius: 10px; padding: 10px 14px;
        }
        :is(.dark) .rp-error { background: #450a0a; }

        .rp-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff; border: none; border-radius: 14px;
          font-size: 16px; font-weight: 700; cursor: pointer;
          margin-top: 8px;
          transition: opacity 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center;
        }
        .rp-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .rp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .rp-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: rp-spin 0.7s linear infinite;
        }
        @keyframes rp-spin { to { transform: rotate(360deg); } }

        /* Success & Invalid states */
        .rp-center { text-align: center; }

        .rp-checkmark {
          width: 72px; height: 72px; margin: 0 auto 20px; display: block;
        }
        .rp-checkmark-circle {
          stroke: #22c55e; stroke-width: 2;
          stroke-dasharray: 166; stroke-dashoffset: 166;
          animation: rp-stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards;
        }
        .rp-checkmark-check {
          stroke: #22c55e; stroke-width: 2.5;
          stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 48; stroke-dashoffset: 48;
          animation: rp-stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.55s forwards;
        }
        @keyframes rp-stroke { to { stroke-dashoffset: 0; } }

        .rp-redirect-note {
          font-size: 13px; color: #94a3b8;
          margin-top: 16px;
        }

        .rp-invalid-icon {
          font-size: 56px; text-align: center; margin-bottom: 16px;
        }
        .rp-login-link {
          display: inline-block; margin-top: 20px;
          color: #7c3aed; font-weight: 600;
          text-decoration: underline; cursor: pointer;
          background: none; border: none; font-size: 15px;
        }
        :is(.dark) .rp-login-link { color: #a78bfa; }
      `}</style>

      <div className="rp-page">
        <div className="rp-card">

          {/* ── No token in URL ── */}
          {isInvalidToken && (
            <div className="rp-center">
              <div className="rp-invalid-icon">🔗</div>
              <h2 className="rp-title">Invalid Link</h2>
              <p className="rp-subtitle">
                This password reset link is missing or malformed.<br />
                Please request a new one from the login page.
              </p>
              <button className="rp-login-link" onClick={() => navigate("/login")}>
                ← Back to Login
              </button>
            </div>
          )}

          {/* ── Success ── */}
          {!isInvalidToken && success && (
            <div className="rp-center">
              <svg viewBox="0 0 52 52" className="rp-checkmark">
                <circle className="rp-checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="rp-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
              <h2 className="rp-title">Password Reset!</h2>
              <p className="rp-subtitle">
                Your password has been updated successfully.<br />
                You can now log in with your new password.
              </p>
              <p className="rp-redirect-note">Redirecting to login in 3 seconds…</p>
            </div>
          )}

          {/* ── Reset Form ── */}
          {!isInvalidToken && !success && (
            <>
              <div className="rp-icon-wrap">
                <HiOutlineLockClosed size={32} />
              </div>
              <h2 className="rp-title">Set New Password</h2>
              <p className="rp-subtitle">Create a strong new password for your account.</p>

              <form onSubmit={handleSubmit}>
                <div className="rp-field">
                  <label className="rp-label">New Password</label>
                  <div className="rp-pw-wrap">
                    <input
                      id="rp-new-password"
                      type={showPw ? "text" : "password"}
                      className={`rp-input ${error ? "rp-input-error" : ""}`}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      autoFocus
                    />
                    <button type="button" className="rp-eye" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="rp-field">
                  <label className="rp-label">Confirm Password</label>
                  <div className="rp-pw-wrap">
                    <input
                      id="rp-confirm-password"
                      type={showCf ? "text" : "password"}
                      className={`rp-input ${error ? "rp-input-error" : ""}`}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                    />
                    <button type="button" className="rp-eye" onClick={() => setShowCf(!showCf)}>
                      {showCf ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                    </button>
                  </div>
                </div>

                {error && <p className="rp-error">{error}</p>}

                <button type="submit" className="rp-btn" disabled={loading}>
                  {loading ? <span className="rp-spinner" /> : "Reset Password"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </>
  );
}
