import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { MdInfoOutline } from "react-icons/md";

// ── Custom Hooks ───────────────────────────────────────────────────────────────
import { useBatchData } from "../hooks/useBatchData";
import { useStudentActions } from "../hooks/useStudentActions";
import { useCourseActions } from "../hooks/useCourseActions";

// ── Layout ─────────────────────────────────────────────────────────────────────
import Admin_Sidebar from "./Admin_Sidebar";
import Admin_Header from "./Admin_Header";

// ── Tab Panels ─────────────────────────────────────────────────────────────────
import Admin_BatchSelector from "./Admin_BatchSelector";
import Admin_StudentsTab from "./Admin_StudentsTab";
import Admin_CoursesTab from "./Admin_CoursesTab";
import Admin_FacultiesTab from "./Admin_FacultiesTab";
import Admin_ScheduleTab from "./Admin_ScheduleTab";

// ── Modals ─────────────────────────────────────────────────────────────────────
import Admin_ModalAddStudent from "./Admin_ModalAddStudent";
import Admin_ModalEditStudent from "./Admin_ModalEditStudent";
import Admin_ModalAddCourse from "./Admin_ModalAddCourse";
import Admin_ModalAssignFaculty from "./Admin_ModalAssignFaculty";
import Admin_ModalEditCourse from "./Admin_ModalEditCourse";
import Admin_ModalPromote from "./Admin_ModalPromote";

// Modal key constants — avoids raw string typos across the tree.
export const MODALS = {
    ADD_STUDENT: "addStudent",
    EDIT_STUDENT: "editStudent",
    ADD_COURSE: "addCourse",
    ASSIGN_FACULTY: "assignFaculty",
    EDIT_COURSE: "editCourse",
    PROMOTE: "promote",
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

    const isBatchSelected = batch.batchData !== null;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <div className="flex h-screen overflow-hidden">

                <Admin_Sidebar
                    activeTab={batch.activeTab}
                    isBatchSelected={isBatchSelected}
                    setActiveTab={batch.setActiveTab}
                />

                <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative">
                    <Admin_Header activeTab={batch.activeTab} logout={logout} />

                    <div className="max-w-6xl mx-auto py-12 px-8 flex flex-col items-center">

                        {!isBatchSelected && (
                            <div className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-8 flex items-center gap-3">
                                <MdInfoOutline className="text-[24px]" />
                                <p className="font-medium">Please select an academic batch configuration to unlock the menu and view information.</p>
                            </div>
                        )}

                        {batch.activeTab === "Change Batch" && (
                            <Admin_BatchSelector
                                formData={batch.formData}
                                handleChange={batch.handleChange}
                                handleFetch={batch.handleFetch}
                                loading={batch.loading}
                                error={batch.error}
                            />
                        )}

                        {batch.activeTab === "Students" && isBatchSelected && (
                            <Admin_StudentsTab
                                batchData={batch.batchData}
                                formData={batch.formData}
                                onAddStudent={() => setActiveModal(MODALS.ADD_STUDENT)}
                                onEditStudent={students.handleEditStudentClick}
                                selectedIds={students.selectedStudentIds}
                                onToggleSelect={students.handleToggleStudentSelection}
                                onSelectAll={students.handleSelectAll}
                                onPromote={() => setActiveModal(MODALS.PROMOTE)}
                            />
                        )}

                        {batch.activeTab === "Courses" && isBatchSelected && (
                            <Admin_CoursesTab
                                batchData={batch.batchData}
                                setIsAddCourseModalOpen={() => setActiveModal(MODALS.ADD_COURSE)}
                                handleOpenAssignFaculty={courses.handleOpenAssignFaculty}
                                handleEditCourseClick={courses.handleEditCourseClick}
                            />
                        )}

                        {batch.activeTab === "Faculties" && isBatchSelected && (
                            <Admin_FacultiesTab batchData={batch.batchData} />
                        )}

                        {batch.activeTab === "Schedule" && isBatchSelected && (
                            <Admin_ScheduleTab />
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
                    selectedCount={students.selectedStudentIds.length}
                    currentBatch={batch.formData}
                    onSubmit={students.handlePromoteSubmit}
                    loading={students.promoteLoading}
                    error={students.promoteError}
                />


            </div>
        </div>
    );
}

export default AdminDash2;