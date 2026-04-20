import React, { useState, useRef, useEffect } from "react";
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
    const abortControllerRef = useRef(null);

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

        // Add user message and a placeholder for the assistant's streaming response
        setMessages((prev) => [
            ...prev,
            { role: "user", text: query },
            { role: "assistant", text: "", sources: [], isStreaming: true },
        ]);
        setInput("");
        setLoading(true);

        try {
            // Cancel any previous requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const response = await fetch(`${API_BASE}/api/academic-ai/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    query,
                    year,
                    branch,
                    student_name: studentName,
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    throw new Error(`Server returned ${response.status}`);
                }
                throw new Error(errorData.error || errorData.message || "Failed to query AI");
            }

            // Stream reading
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunkStr = decoder.decode(value, { stream: true });
                    const events = chunkStr.split("\n\n"); // SSE events are separated by double newlines

                    for (const ev of events) {
                        if (ev.startsWith("data: ")) {
                            const dataStr = ev.substring(6);
                            if (!dataStr.trim()) continue;

                            try {
                                const parsed = JSON.parse(dataStr);

                                if (parsed.token) {
                                    // Append token to the latest assistant message
                                    setMessages((prev) => {
                                        const newMsgs = [...prev];
                                        const last = { ...newMsgs[newMsgs.length - 1] };
                                        last.text += parsed.token;
                                        newMsgs[newMsgs.length - 1] = last;
                                        return newMsgs;
                                    });
                                } else if (parsed.done || parsed.sources) {
                                    // Final event containing sources
                                    setMessages((prev) => {
                                        const newMsgs = [...prev];
                                        const last = { ...newMsgs[newMsgs.length - 1] };
                                        last.sources = parsed.sources || [];
                                        last.isStreaming = false;
                                        newMsgs[newMsgs.length - 1] = last;
                                        return newMsgs;
                                    });
                                }
                            } catch (e) {
                                console.error("Error parsing JSON chunk:", e, dataStr);
                            }
                        }
                    }
                }
            }

        } catch (err) {
            if (err.name === "AbortError") {
                console.log("Fetch aborted by user.");
                return;
            }
            setMessages((prev) => {
                const newMsgs = [...prev];
                // Replace the empty streaming placeholder with the error message
                newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    text: `⚠️ ${err.message || "Something went wrong. Please try again."}`,
                    isError: true,
                    isStreaming: false
                };
                return newMsgs;
            });
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

    const stopResponse = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
        setMessages((prev) => {
            const newMsgs = [...prev];
            const last = { ...newMsgs[newMsgs.length - 1] };
            if (last.isStreaming) {
                last.isStreaming = false;
                last.text += " [Stopped]";
                newMsgs[newMsgs.length - 1] = last;
            }
            return newMsgs;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex justify-end font-antiqua overflow-hidden">
            {/* Backdrop: dim the rest of the screen */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide-in Drawer */}
            <div className="relative w-full md:w-[450px] lg:w-[500px] h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slideLeft transform transition-transform duration-300 ease-in-out">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between shrink-0 shadow-md z-10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white dark:bg-slate-800/20 p-2.5 rounded-xl">
                            <HiOutlineSparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-xl leading-tight">
                                Academic AI
                            </h3>
                            <p className="text-blue-100 text-sm opacity-90">
                                {branch} • Year {year}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white dark:bg-slate-800/10 p-2 rounded-xl transition-all"
                    >
                        <HiOutlineX className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-[#f8f9fb] dark:bg-slate-900/20">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[88%] rounded-2xl px-5 py-4 text-[15px] leading-relaxed ${msg.role === "user"
                                    ? "bg-blue-600 text-white rounded-tr-sm shadow-md"
                                    : msg.isError
                                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-100 rounded-tl-sm shadow-sm"
                                        : "bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-slate-600 rounded-tl-sm"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.text || (msg.isStreaming ? "..." : "")}</p>

                                {/* Streaming cursor indicator */}
                                {msg.isStreaming && (
                                    <span className="inline-block w-2 bg-blue-500 rounded-full ml-1 animate-pulse" style={{ height: '1.2em', verticalAlign: 'text-bottom' }}></span>
                                )}

                                {/* Sources (Render only when done streaming) */}
                                {msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-600">
                                        <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                                            Sources Mentioned
                                        </p>
                                        <div className="space-y-2">
                                            {msg.sources.map((src, j) => (
                                                <div
                                                    key={j}
                                                    className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700 p-2 rounded-lg border border-gray-100 dark:border-slate-600"
                                                >
                                                    <HiOutlineDocumentText className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                                                    <span className="truncate flex-1">
                                                        {src.document}
                                                        {src.page !== "?" && ` (p.${src.page})`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-600 shrink-0 z-10 shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center space-x-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your courses, syllabus, or notes..."
                            disabled={loading}
                            className="flex-1 px-5 py-4 bg-[#f0f2f5] dark:bg-slate-900 rounded-2xl text-[15px] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                        />
                        {loading ? (
                            <button
                                onClick={stopResponse}
                                className="bg-red-500 text-white p-4 rounded-2xl hover:bg-red-600 transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center group"
                                title="Stop Response"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim()}
                                className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed active:scale-95 shrink-0 flex items-center justify-center group"
                                title="Send Message"
                            >
                                <HiOutlinePaperAirplane className="w-6 h-6 rotate-90 group-hover:translate-x-1 group-active:translate-x-0 transition-transform" />
                            </button>
                        )}
                    </div>
                    <div className="mt-3 text-center">
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">AI can make mistakes. Verify important information.</span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideLeft {
                    from { transform: translateX(100%); opacity: 0.5; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slideLeft {
                    animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default AcademicAI;
