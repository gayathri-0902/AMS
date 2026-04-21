import React, { useState, useRef, useEffect } from "react";
import {
    HiOutlineSparkles,
    HiOutlineX,
    HiOutlinePaperAirplane,
    HiOutlineDocumentText,
    HiOutlineBookOpen,
} from "react-icons/hi";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const FacultyAcademicAI = ({ isOpen, onClose, facultyName, subjects }) => {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: `Hello Professor ${facultyName || ""}! 👋 I'm your Academic Research Assistant. I'm ready to help you compile comprehensive lecture notes and extract key concepts from your assigned subjects (...). What topic should we research today?`,
        },
    ]);

    // Update the welcome message once the subjects data loads asynchronously
    useEffect(() => {
        if (subjects && subjects.length > 0 && messages.length === 1 && messages[0].role === "assistant") {
            const subjectListStr = subjects.map((s) => s.course_code).join(", ");
            setMessages([{
                role: "assistant",
                text: `Hello Professor ${facultyName || ""}! 👋 I'm your Academic Research Assistant. I'm ready to help you compile comprehensive lecture notes and extract key concepts from your assigned subjects (${subjectListStr}). What topic should we research today?`,
            }]);
        }
    }, [subjects, facultyName]);

    const [input, setInput] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("ALL");
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

            const response = await fetch(`${API_BASE}/api/faculty-ai/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    query,
                    subject_codes: selectedSubject === "ALL" 
                        ? (subjects || []).map((s) => s.course_code) 
                        : [selectedSubject],
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

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunkStr = decoder.decode(value, { stream: true });
                    const events = chunkStr.split("\n\n");

                    for (const ev of events) {
                        if (ev.startsWith("data: ")) {
                            const dataStr = ev.substring(6);
                            if (!dataStr.trim()) continue;

                            try {
                                const parsed = JSON.parse(dataStr);

                                if (parsed.token) {
                                    setMessages((prev) => {
                                        const newMsgs = [...prev];
                                        const last = { ...newMsgs[newMsgs.length - 1] };
                                        last.text += parsed.token;
                                        newMsgs[newMsgs.length - 1] = last;
                                        return newMsgs;
                                    });
                                } else if (parsed.done || parsed.sources) {
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
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full md:w-[450px] lg:w-[540px] h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slideLeft transform transition-transform duration-300 ease-in-out">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5 flex items-center justify-between shrink-0 shadow-md z-10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white dark:bg-slate-800/20 p-2.5 rounded-xl">
                            <HiOutlineSparkles className="w-6 h-6 text-blue-700 dark:text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-xl leading-tight">
                                Faculty Research Assistant
                            </h3>
                            <p className="text-blue-100 text-xs opacity-90 uppercase tracking-tighter">
                                Lecture Notes Compiler
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

                {/* Subject Selector Bar */}
                <div className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700 px-5 py-3 flex items-center space-x-3 shrink-0 z-10 relative">
                    <HiOutlineBookOpen className="text-blue-600 w-5 h-5 shrink-0" />
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="flex-1 appearance-none bg-transparent text-sm font-bold text-gray-700 dark:text-slate-200 outline-none cursor-pointer py-1.5 focus:ring-2 focus:ring-blue-500/50 rounded-md transition-shadow"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2.5' stroke='%233b82f6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundPosition: "right 0.2rem center",
                            backgroundSize: "1rem 1rem",
                            backgroundRepeat: "no-repeat",
                            paddingRight: "1.5rem"
                        }}
                    >
                        <option className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium" value="ALL">
                            🌐 Global Search (All Assigned Subjects)
                        </option>
                        {subjects.map((sub) => (
                            <option className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium" key={sub.course_code} value={sub.course_code}>
                                📚 {sub.course_code} - {sub.course_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-[#f8f9fb] dark:bg-slate-900/10">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[90%] rounded-2xl px-5 py-4 text-[15px] leading-relaxed relative ${msg.role === "user"
                                    ? "bg-blue-600 text-white rounded-tr-sm shadow-md"
                                    : msg.isError
                                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-100 rounded-tl-sm shadow-sm"
                                        : "bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-slate-600 rounded-tl-sm"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.text || (msg.isStreaming ? "..." : "")}</p>

                                {msg.isStreaming && (
                                    <span className="inline-block w-2 bg-blue-500 rounded-full ml-1 animate-pulse" style={{ height: '1.2em', verticalAlign: 'text-bottom' }}></span>
                                )}

                                {msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-600">
                                        <p className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                                            Reference Materials
                                        </p>
                                        <div className="space-y-2">
                                            {msg.sources.map((src, j) => (
                                                <div
                                                    key={j}
                                                    className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 p-2 rounded-lg border border-gray-100 dark:border-slate-600"
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
                        <textarea
                            ref={inputRef}
                            rows="1"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedSubject === "ALL" ? "Enter a topic to compile notes for..." : `Compile notes for ${selectedSubject}...`}
                            disabled={loading}
                            className="flex-1 px-5 py-4 bg-[#f0f2f5] dark:bg-slate-900 rounded-2xl text-[15px] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 resize-none h-[56px] overflow-hidden"
                        />
                        {loading ? (
                            <button
                                onClick={stopResponse}
                                className="bg-red-500 text-white p-4 rounded-2xl hover:bg-red-600 transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center"
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

export default FacultyAcademicAI;
