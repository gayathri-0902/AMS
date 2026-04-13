import React, { useState } from "react";
import { MdClose, MdCloudUpload, MdCheckCircle, MdError, MdFileDownload, MdInfoOutline } from "react-icons/md";
import axios from "axios";
import * as XLSX from "xlsx";

/**
 * COMPONENT: Admin_ModalBulkUpload
 * Handles CSV/Excel selection, data preview, and bulk import to the backend.
 */
const Admin_ModalBulkUpload = ({ isOpen, onClose, onRefresh }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    // --- File Parsing for Preview (supports both CSV and XLSX) ---
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExt = selectedFile.name.split(".").pop().toLowerCase();
        const isExcel = ["xlsx", "xls"].includes(fileExt);

        if (!isExcel && fileExt !== "csv") {
            setError("Please upload a valid .csv or .xlsx file.");
            return;
        }

        setFile(selectedFile);
        setError("");
        
        const reader = new FileReader();
        
        if (isExcel) {
            // Excel Preview Logic
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    setPreviewData(jsonData);
                } catch (err) {
                    setError("Failed to parse Excel file preview.");
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        } else {
            // CSV Preview Logic (Simple character fallback)
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const rows = text.split("\n").filter(row => row.trim() !== "");
                    if (rows.length === 0) return;
                    
                    const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
                    const data = rows.slice(1).map(row => {
                        const values = row.split(",").map(v => v.trim());
                        const obj = {};
                        headers.forEach((header, i) => {
                            obj[header] = values[i];
                        });
                        return obj;
                    });
                    setPreviewData(data);
                } catch (err) {
                    setError("Failed to parse CSV file preview.");
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("csvFile", file);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bulk-add-students`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setResults(response.data);
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(err.response?.data?.message || "Import failed. Please check the file format.");
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "name,roll_no,email,password,yr,sem,stream,academic_yr\n";
        const sample = "John Doe,21CS001,john@example.com,Student@123,2,4,CSDS,2021-2025\n";
        const blob = new Blob([headers + sample], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "student_import_template.csv";
        a.click();
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setResults(null);
        setError("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Bulk Student Import</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Add multiple students using a CSV or Excel file</p>
                    </div>
                    <button onClick={reset} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <MdClose className="text-2xl text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {!results ? (
                        <>
                            {/* Template Download */}
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                        <MdFileDownload className="text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Need a template?</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">Download our formatted CSV to get started.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={downloadTemplate}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                >
                                    Download Template
                                </button>
                            </div>

                            {/* Upload Area */}
                            {!file ? (
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all cursor-pointer group relative">
                                    <input 
                                        type="file" 
                                        accept=".csv, .xlsx, .xls" 
                                        onChange={handleFileChange} 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <MdCloudUpload className="text-4xl text-blue-500" />
                                    </div>
                                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Click to upload or drag and drop</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">.CSV and .XLSX files are supported</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                            Selected: <span className="text-blue-600 dark:text-blue-400">{file.name}</span>
                                        </h3>
                                        <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-xs text-red-500 hover:underline font-medium">Remove File</button>
                                    </div>
                                    
                                    {previewData.length > 0 ? (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                            <div className="max-h-[300px] overflow-auto">
                                                <table className="w-full text-sm text-left border-collapse">
                                                    <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                                                        <tr>
                                                            {Object.keys(previewData[0]).map(header => (
                                                                <th key={header} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 capitalize">{header.replace("_", " ")}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                        {previewData.map((row, i) => (
                                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                                {Object.values(row).map((val, j) => (
                                                                    <td key={j} className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{val}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                No preview available for this file.
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 italic">Total {previewData.length} records detected.</p>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                                    <MdError className="shrink-0" />
                                    {error}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Results View */
                        <div className="py-4">
                            {results.sheetWarning && (
                                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200">
                                    <MdInfoOutline className="text-2xl shrink-0" />
                                    <p className="text-sm font-medium">{results.sheetWarning}</p>
                                </div>
                            )}
                            <div className="flex flex-col items-center mb-8">
                                <div className={`p-4 rounded-full mb-4 ${results.summary.failureCount === 0 ? "bg-green-100/50 dark:bg-green-900/20 text-green-600" : "bg-orange-100/50 dark:bg-orange-900/20 text-orange-600"}`}>
                                    {results.summary.failureCount === 0 ? <MdCheckCircle className="text-6xl" /> : <MdInfoOutline className="text-6xl" />}
                                </div>
                                <h3 className="text-2xl font-bold dark:text-white">Import Complete</h3>
                                <div className="mt-4 flex gap-8">
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-green-600">{results.summary.successCount}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Succeeded</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-red-500">{results.summary.failureCount}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Failed</p>
                                    </div>
                                </div>
                            </div>

                            {results.failureList.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Failure Details</h4>
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-xl overflow-hidden">
                                        <ul className="divide-y divide-red-100 dark:divide-red-900/20 text-sm max-h-[250px] overflow-auto">
                                            {results.failureList.map((f, i) => (
                                                <li key={i} className="px-4 py-3 flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">{f.roll_no}</span>
                                                        <span className="mx-2 text-slate-400">—</span>
                                                        <span className="text-slate-600 dark:text-slate-400">{f.name}</span>
                                                    </div>
                                                    <span className="text-red-500 font-medium">{f.error}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    {!results ? (
                        <>
                            <button onClick={reset} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg ${!file || loading ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"}`}
                            >
                                {loading ? "Processing..." : "Start Import"}
                            </button>
                        </>
                    ) : (
                        <button onClick={reset} className="px-8 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all">
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin_ModalBulkUpload;
