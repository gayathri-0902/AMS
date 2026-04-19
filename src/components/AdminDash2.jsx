import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { MdInfoOutline } from "react-icons/md";

// ── Custom Hooks ───────────────────────────────────────────────────────────────
import { useBatchData } from "../hooks/useBatchData";
import { useStudentActions } from "../hooks/useStudentActions";
import { useCourseActions } from "../hooks/useCourseActions";
import { useFacultyActions } from "../hooks/useFacultyActions";
import { useTimetableActions } from "../hooks/useTimetableActions";

// ── Layout ─────────────────────────────────────────────────────────────────────
import Admin_Sidebar from "./Admin_Sidebar";
import Admin_Header from "./Admin_Header";

// ── Tab Panels ─────────────────────────────────────────────────────────────────
// ── Tab Panels ─────────────────────────────────────────────────────────────────
import Admin_FilterBar from "./Admin_FilterBar";
import Admin_StudentsTab from "./Admin_StudentsTab";
import Admin_CoursesTab from "./Admin_CoursesTab";
import Admin_FacultiesTab from "./Admin_FacultiesTab";
import Admin_ScheduleTab from "./Admin_ScheduleTab";
import Admin_FeedbackTab from "./Admin_FeedbackTab";

// ── Modals ─────────────────────────────────────────────────────────────────────
import Admin_ModalAddStudent from "./Admin_ModalAddStudent";
import Admin_ModalEditStudent from "./Admin_ModalEditStudent";
import Admin_ModalAddCourse from "./Admin_ModalAddCourse";
import Admin_ModalAssignFaculty from "./Admin_ModalAssignFaculty";
import Admin_ModalEditCourse from "./Admin_ModalEditCourse";
import Admin_ModalPromote from "./Admin_ModalPromote";
import Admin_ModalAddFaculty from "./Admin_ModalAddFaculty";
import Admin_ModalEditFaculty from "./Admin_ModalEditFaculty";
import Admin_ModalAddSession from "./Admin_ModalAddSession";
import Admin_ModalBulkUpload from "./Admin_ModalBulkUpload";
import Admin_ModalConfirm from "./Admin_ModalConfirm";

// Modal key constants — avoids raw string typos across the tree.
export const MODALS = {
    ADD_STUDENT: "addStudent",
    EDIT_STUDENT: "editStudent",
    BULK_UPLOAD: "bulkUpload",
    ADD_COURSE: "addCourse",
    ASSIGN_FACULTY: "assignFaculty",
    EDIT_COURSE: "editCourse",
    PROMOTE: "promote",
    ADD_FACULTY: "addFaculty",
    EDIT_FACULTY: "editFaculty",
    ADD_SESSION: "addSession",
    CONFIRM_ARCHIVE: "confirmArchive",
};

function AdminDash2() {
    const { logout } = useAuth();

    // ── Single modal state (replaces 5 boolean flags) ──────────────────────────
    const [activeModal, setActiveModal] = useState(null);

    // ── Domain hooks ───────────────────────────────────────────────────────────
    const batch = useBatchData();

    const students = useStudentActions({
        batchData: batch.batchData,
        formData: batch.formData,
        refetchBatchData: batch.refetchBatchData,
        setActiveModal,
    });

    const courses = useCourseActions({
        batchData: batch.batchData,
        refetchBatchData: batch.refetchBatchData,
        setActiveModal,
    });

    const faculties = useFacultyActions({
        setActiveModal,
        refetchBatchData: batch.refetchBatchData,
    });

    const timetable = useTimetableActions({
        batchData: batch.batchData,
        refetchBatchData: batch.refetchBatchData,
        setActiveModal,
    });

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const isBatchSelected = !!batch.batchData?.yr_sem_id;

    // ── Search State ───────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");

    // ── Render Helpers ─────────────────────────────────────────────────────────

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="flex h-screen overflow-hidden">

                <Admin_Sidebar
                    activeTab={batch.activeTab}
                    isBatchSelected={true}
                    setActiveTab={batch.setActiveTab}
                    isCollapsed={isSidebarCollapsed}
                    setIsCollapsed={setIsSidebarCollapsed}
                />

                <main className={`flex-1 overflow-y-auto bg-white dark:bg-slate-800 dark:bg-slate-900 relative transition-all duration-300 ${isSidebarCollapsed ? "ml-0" : ""}`}>
                    <Admin_Header 
                        activeTab={batch.activeTab} 
                        logout={logout} 
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        showSearch={["Students", "Courses", "Faculties"].includes(batch.activeTab)}
                    />

                    <div className="max-w-6xl mx-auto py-12 px-8 flex flex-col items-center">


                        {!batch.loading && batch.activeTab === "Students" && (
                            <Admin_StudentsTab
                                batchData={batch.batchData}
                                formData={batch.formData}
                                searchTerm={searchTerm}
                                onAddStudent={() => setActiveModal(MODALS.ADD_STUDENT)}
                                onBulkUpload={() => setActiveModal(MODALS.BULK_UPLOAD)}
                                onEditStudent={students.handleEditStudentClick}
                                selectedIds={students.selectedStudentIds}
                                onToggleSelect={students.handleToggleStudentSelection}
                                onSelectAll={students.handleSelectAll}
                                onPromote={() => setActiveModal(MODALS.PROMOTE)}
                                // Pagination props
                                hasMore={batch.hasMore}
                                loadMore={batch.loadMore}
                                loadingMore={batch.loadingMore}
                                // Props for FilterBar (now handled at top level, but kept if needed)
                                handleChange={batch.handleChange}
                                handleFetch={batch.handleFetch}
                                clearFilters={batch.clearFilters}
                                loading={batch.loading}
                                isArchived={batch.formData.isArchived === "true"}
                                onArchiveStudent={students.handleArchiveClick}
                                onRestoreStudent={students.handleRestoreStudent}
                                toggleArchivedView={batch.toggleArchivedView}
                            />
                        )}

                        {!batch.loading && batch.activeTab === "Courses" && (
                            <Admin_CoursesTab
                                batchData={batch.batchData}
                                searchTerm={searchTerm}
                                setIsAddCourseModalOpen={() => setActiveModal(MODALS.ADD_COURSE)}
                                handleOpenAssignFaculty={courses.handleOpenAssignFaculty}
                                handleEditCourseClick={courses.handleEditCourseClick}
                                // Props for FilterBar
                                formData={batch.formData}
                                handleChange={batch.handleChange}
                                handleFetch={batch.handleFetch}
                                clearFilters={batch.clearFilters}
                                loading={batch.loading}
                                toggleArchivedView={batch.toggleArchivedView}
                                isArchived={batch.formData.isArchived === "true"}
                            />
                        )}

                        {!batch.loading && batch.activeTab === "Faculties" && (
                            <Admin_FacultiesTab
                                batchData={batch.batchData}
                                searchTerm={searchTerm}
                                onAddFaculty={() => setActiveModal(MODALS.ADD_FACULTY)}
                                onEditFaculty={faculties.handleEditFacultyClick}
                                // Props for FilterBar
                                formData={batch.formData}
                                handleChange={batch.handleChange}
                                handleFetch={batch.handleFetch}
                                clearFilters={batch.clearFilters}
                                loading={batch.loading}
                                toggleArchivedView={batch.toggleArchivedView}
                                isArchived={batch.formData.isArchived === "true"}
                            />
                        )}

                        {!batch.loading && batch.activeTab === "Schedule" && (
                            <Admin_ScheduleTab 
                                batchData={batch.batchData} 
                                formData={batch.formData}
                                onAddSession={timetable.handleOpenAddSession}
                                // Props for FilterBar and Logic
                                handleChange={batch.handleChange}
                                handleFetch={batch.handleFetch}
                                clearFilters={batch.clearFilters}
                                loading={batch.loading}
                                toggleArchivedView={batch.toggleArchivedView}
                                isArchived={batch.formData.isArchived === "true"}
                            />
                        )}

                        {!batch.loading && batch.activeTab === "Feedback" && (
                            <Admin_FeedbackTab />
                        )}

                    </div>
                </main>

                {/* ── Modals — driven entirely by the activeModal string ──────── */}

                <Admin_ModalAddStudent
                    isOpen={activeModal === MODALS.ADD_STUDENT}
                    onClose={() => setActiveModal(null)}
                    form={students.addStudentForm}
                    onChange={students.handleAddStudentChange}
                    onSubmit={students.handleAddStudentSubmit}
                    loading={students.addLoading}
                    error={students.addError}
                />

                <Admin_ModalEditStudent
                    isOpen={activeModal === MODALS.EDIT_STUDENT}
                    onClose={() => setActiveModal(null)}
                    form={students.editStudentForm}
                    onChange={students.handleEditStudentChange}
                    onSubmit={students.handleEditStudentSubmit}
                    loading={students.editLoading}
                    error={students.editError}
                />

                <Admin_ModalAddCourse
                    isOpen={activeModal === MODALS.ADD_COURSE}
                    onClose={() => setActiveModal(null)}
                    form={courses.addCourseForm}
                    onChange={courses.handleAddCourseChange}
                    onSubmit={courses.handleAddCourseSubmit}
                    loading={courses.addCourseLoading}
                    error={courses.addCourseError}
                />

                <Admin_ModalAssignFaculty
                    isOpen={activeModal === MODALS.ASSIGN_FACULTY}
                    onClose={() => setActiveModal(null)}
                    courseData={courses.assignFacultyCourseData}
                    form={courses.assignFacultyForm}
                    onChange={courses.setAssignFacultyForm}
                    onSubmit={courses.handleAssignFacultySubmit}
                    loading={courses.assignFacultyLoading}
                    error={courses.assignFacultyError}
                />

                <Admin_ModalEditCourse
                    isOpen={activeModal === MODALS.EDIT_COURSE}
                    onClose={() => setActiveModal(null)}
                    form={courses.editCourseForm}
                    onChange={courses.handleEditCourseChange}
                    onSubmit={courses.handleEditCourseSubmit}
                    onRemoveFaculty={courses.handleRemoveFaculty}
                    loading={courses.editCourseLoading}
                    error={courses.editCourseError}
                    tab={courses.editCourseTab}
                    setTab={courses.setEditCourseTab}
                />

                <Admin_ModalPromote
                    isOpen={activeModal === MODALS.PROMOTE}
                    onClose={() => setActiveModal(null)}
                    selectedStudents={(batch.batchData?.students || []).filter(s => students.selectedStudentIds.includes(s._id))}
                    onSubmit={students.handlePromoteSubmit}
                    loading={students.promoteLoading}
                    error={students.promoteError}
                />

                <Admin_ModalAddFaculty
                    isOpen={activeModal === MODALS.ADD_FACULTY}
                    onClose={() => setActiveModal(null)}
                    form={faculties.addFacultyForm}
                    onChange={faculties.handleAddFacultyChange}
                    onSubmit={faculties.handleAddFacultySubmit}
                    loading={faculties.addLoading}
                    error={faculties.addError}
                />

                <Admin_ModalEditFaculty
                    isOpen={activeModal === MODALS.EDIT_FACULTY}
                    onClose={() => setActiveModal(null)}
                    form={faculties.editFacultyForm}
                    onChange={faculties.handleEditFacultyChange}
                    onSubmit={faculties.handleEditFacultySubmit}
                    loading={faculties.editLoading}
                    error={faculties.editError}
                />

                <Admin_ModalAddSession
                    isOpen={activeModal === MODALS.ADD_SESSION}
                    onClose={() => setActiveModal(null)}
                    form={timetable.addSessionForm}
                    onChange={timetable.handleAddSessionChange}
                    onSubmit={timetable.handleAddSessionSubmit}
                    loading={timetable.addSessionLoading}
                    error={timetable.addSessionError}
                    courses={batch.batchData?.courses || []}
                    faculties={faculties.faculties || []}
                />

                <Admin_ModalBulkUpload 
                    isOpen={activeModal === MODALS.BULK_UPLOAD}
                    onClose={() => setActiveModal(null)}
                    onImport={batch.refetchBatchData} 
                />

                <Admin_ModalConfirm
                    isOpen={activeModal === MODALS.CONFIRM_ARCHIVE}
                    onClose={() => setActiveModal(null)}
                    onConfirm={students.handleConfirmArchive}
                    title={`Archive ${students.pendingArchiveStudent?.name}?`}
                    message={`This move "${students.pendingArchiveStudent?.name}" to the Archive and revoke their login access. You can restore them at any time from the Archive view.`}
                    loading={students.archivingLoading}
                    type="archive"
                />
            </div>
        </div>
    );
}

export default AdminDash2;