import { useState } from "react";
import axios from "axios";

/**
 * Manages batch selection form state, data fetching, and the active dashboard tab.
 * Exposes `refetchBatchData` for child hooks to call after mutations.
 */
export function useBatchData() {
    const [formData, setFormData] = useState({
        yr: "",
        sem: "",
        stream: "",
        academic_yr: "",
    });
    const [batchData, setBatchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("Change Batch");

    const handleChange = (e) =>
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    /** Re-fetches using the current formData without resetting the UI. */
    const refetchBatchData = async () => {
        const { yr, sem, stream, academic_yr } = formData;
        const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/admin/batch-data`, 
            { params: { yr, sem, stream, academic_yr } }
        );
        setBatchData(response.data);
    };

    const handleFetch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setBatchData(null);
        try {
            const { yr, sem, stream, academic_yr } = formData;
            if (!yr || !sem || !stream || !academic_yr)
                throw new Error("Please fill in all fields");

            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/batch-data`,
                { params: { yr, sem, stream, academic_yr } }
            );
            setBatchData(response.data);
            setActiveTab("Students");
        } catch (err) {
            setError(
                err.response?.data?.message || err.message || "Failed to fetch data"
            );
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        batchData,
        loading,
        error,
        activeTab,
        setActiveTab,
        handleChange,
        handleFetch,
        refetchBatchData,
    };
}
