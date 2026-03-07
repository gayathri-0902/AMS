import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
    HiOutlineSparkles,
    HiOutlineX,
    HiOutlinePaperAirplane,
    HiOutlineDocumentText,
} from "react-icons/hi";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const AcademicAI = ({ isOpen, onClose, studentName, year, branch }) => {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: `Hey ${studentName || "there"}! 👋 I'm your Academic AI assistant. Ask me anything about your coursework!`,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const sendMessage = async () => {
        const query = input.trim();
        if (!query || loading) return;

        // Add user message
        setMessages((prev) => [...prev, { role: "user", text: query }]);
        setInput("");
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE}/api/academic-ai/query`, {
                query,
                year,
                branch,
                student_name: studentName,
            });

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: res.data.answer,
                    sources: res.data.sources || [],
                },
            ]);
        } catch (err) {
            const errMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Something went wrong. Please try again.";
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: `⚠️ ${errMsg}`, isError: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-end justify-end p-4 md:p-8 pointer-events-none font-antiqua">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            {/* Chat Panel */}
            <div className="relative w-full max-w-md h-[600px] bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-gray-100 animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <HiOutlineSparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg leading-tight">
                                Academic AI
                            </h3>
                            <p className="text-blue-100 text-xs">
                                {branch} • Year {year}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
                    >
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#f8f9fb]">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-md"
                                        : msg.isError
                                            ? "bg-red-50 text-red-600 border border-red-100 rounded-bl-md"
                                            : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.text}</p>

                                {/* Sources */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            Sources
                                        </p>
                                        {msg.sources.map((src, j) => (
                                            <div
                                                key={j}
                                                className="flex items-center space-x-2 text-xs text-gray-500 mb-1"
                                            >
                                                <HiOutlineDocumentText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                <span>
                                                    {src.document}
                                                    {src.page !== "?" && `, p.${src.page}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-gray-400 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                                <div className="flex space-x-1.5">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your courses..."
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-[#f0f2f5] rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all disabled:opacity-50"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
                        >
                            <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default AcademicAI;
