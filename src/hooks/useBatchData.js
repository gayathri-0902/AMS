import { useState, useEffect, useCallback } from "react";
import axios from "axios";

/**
 * Manages batch selection form state, data fetching, and the active dashboard tab.
 * REFACTORED: Now fetches institution-wide data by default on mount.
 */
export function useBatchData() {
    const [formData, setFormData] = useState({
        yr: "",
        sem: "",
        stream: "",
        academic_yr: "",
        status: "active", // Default to active
    });
    const [page, setPage] = useState(1);
    const [batchData, setBatchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("Students");

    const handleChange = (e) =>
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const setStatus = (status) => {
        setFormData((prev) => ({ ...prev, status }));
    };

    /** Fetches data based on current formData. If formData is empty, fetches all institution-wide. */
    const fetchBatchData = useCallback(async (params = {}, isLoadMore = false) => {
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin/batch-data`,
                { 
                    params: { 
                        ...formData, 
                        ...params, 
                        page: isLoadMore ? page + 1 : 1, 
                        limit: 100 
                    } 
                }
            );
            
            if (isLoadMore) {
                setBatchData(prev => ({
                    ...response.data,
                    students: [...prev.students, ...response.data.students]
                }));
                setPage(prev => prev + 1);
            } else {
                setBatchData(response.data);
                setPage(1);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to fetch data");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [formData, page]);

    /** Initial fetch on mount */
    useEffect(() => {
        fetchBatchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Standard fetch triggered by UI button */
    const handleFetch = (overrides = {}) => {
        setPage(1);
        setBatchData({ students: [], courses: [], faculties: [], timetable: [], totalStudents: 0 });
        fetchBatchData({ page: 1, ...overrides });
        if (activeTab === "Change Batch") setActiveTab("Students");
    };

    /** Loads next page of students */
    const loadMore = async () => {
        if (batchData?.hasMore && !loadingMore) {
            await fetchBatchData(formData, true);
        }
    };

    /** Re-fetches using current formData */
    const refetchBatchData = async () => {
        await fetchBatchData(formData);
    };

    /** Resets all filters */
    const clearFilters = async () => {
        const resetData = { yr: "", sem: "", stream: "", academic_yr: "", status: "active" };
        setFormData(resetData);
        await fetchBatchData(resetData);
    };

    return {
        formData,
        batchData,
        loading,
        loadingMore,
        error,
        activeTab,
        setActiveTab,
        handleChange,
        handleFetch,
        loadMore,
        refetchBatchData,
        clearFilters,
        isFiltered: batchData?.isFiltered || false,
        hasMore: batchData?.hasMore || false,
    };
}
