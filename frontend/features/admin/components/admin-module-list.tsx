"use client";

import { useEffect, useState } from "react";
import {
  Download,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  Trash2,
  Globe,
  Lock,
  Plus,
  UploadCloud,
  FileCheck,
  Eye,
} from "lucide-react";
import {
  fetchAdminModules,
  fetchAdminCourses,
  publishModule,
  unpublishModule,
  deleteModule,
  createAndUploadModule,
} from "../api/admin.api";
import type { AdminModuleItem } from "../types/admin.type";
import type { Course } from "@/features/courses/types/course.type";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";

export function AdminModuleList() {
  const [modules, setModules] = useState<AdminModuleItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [collapsedCourses, setCollapsedCourses] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [selectedModuleForDetail, setSelectedModuleForDetail] = useState<AdminModuleItem | null>(null);

  // In-browser Document Preview state
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    fileUrl: string;
    fileExtension: string;
    courseCode?: string;
  } | null>(null);

  // Upload Module Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newModuleCourseId, setNewModuleCourseId] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-dismiss notification banners
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadData = async () => {
    try {
      const [mList, cList] = await Promise.all([
        fetchAdminModules(),
        fetchAdminCourses(),
      ]);
      setModules(mList);
      setCourses(cList);
      if (selectedModuleForDetail) {
        const updated = mList.find((m) => m.id === selectedModuleForDetail.id);
        if (updated) setSelectedModuleForDetail(updated);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load module management data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const [mList, cList] = await Promise.all([
          fetchAdminModules(),
          fetchAdminCourses(),
        ]);
        if (isMounted) {
          setModules(mList);
          setCourses(cList);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load module management data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleCourseCollapse = (courseId: string) => {
    setCollapsedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleTogglePublish = async (mod: AdminModuleItem) => {
    setActiveModuleId(mod.id);
    setError(null);
    setActionSuccess(null);

    try {
      if (mod.is_published) {
        const res = await unpublishModule(mod.id);
        setActionSuccess(res.message || "Module unpublished successfully.");
      } else {
        const res = await publishModule(mod.id);
        setActionSuccess(res.message || "Module published successfully.");
      }
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update publish state");
    } finally {
      setActiveModuleId(null);
    }
  };

  const handleDelete = async (mod: AdminModuleItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${mod.title}"?`)) {
      return;
    }

    setActiveModuleId(mod.id);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await deleteModule(mod.id);
      setActionSuccess(res.message || "Module deleted successfully.");
      if (selectedModuleForDetail?.id === mod.id) {
        setSelectedModuleForDetail(null);
      }
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete module");
    } finally {
      setActiveModuleId(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleCourseId) {
      setError("Please select a target course for this module.");
      return;
    }
    if (!newModuleTitle.trim()) {
      setError("Please provide a module title.");
      return;
    }
    if (!selectedFile) {
      setError("Please select a PDF or DOCX file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await createAndUploadModule(
        newModuleCourseId,
        newModuleTitle.trim(),
        newModuleDescription.trim(),
        selectedFile
      );
      setActionSuccess(res.message || "Learning module uploaded successfully.");
      setShowUploadModal(false);
      setNewModuleTitle("");
      setNewModuleDescription("");
      setSelectedFile(null);
      setNewModuleCourseId("");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload module.");
    } finally {
      setIsUploading(false);
    }
  };

  // Group modules by Course
  const courseMap = new Map<string, Course>();
  courses.forEach((c) => courseMap.set(c.id, c));

  const filteredModules = modules.filter((m) => {
    const courseId = m.course_id || "";
    const course = courseMap.get(courseId);
    const matchesCourse =
      selectedCourseFilter === "all" || m.course_id === selectedCourseFilter;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course && course.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course && course.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCourse && matchesSearch;
  });

  // Group filtered modules by course
  const groupedModules = new Map<string, AdminModuleItem[]>();
  filteredModules.forEach((m) => {
    const key = m.course_id || "unassigned";
    const list = groupedModules.get(key) || [];
    list.push(m);
    groupedModules.set(key, list);
  });

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {actionSuccess && (
        <div className="rounded-2xl bg-slate-900 border border-slate-200 px-4 py-3 text-xs font-medium text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search module title, description, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="text-xs px-3.5 py-2 border border-slate-200 rounded-full bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
          >
            <option value="all">All Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            if (courses.length > 0) setNewModuleCourseId(courses[0].id);
            setShowUploadModal(true);
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-all flex items-center gap-1.5 self-end sm:self-auto active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Module</span>
        </button>
      </div>

      {/* Module List Groups by Course */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
          Loading learning modules...
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-xs">
          No learning modules found matching your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedModules.entries()).map(([courseId, courseModules]) => {
            const course = courseId !== "unassigned" ? courseMap.get(courseId) : undefined;
            const isCollapsed = collapsedCourses.has(courseId);

            return (
              <div
                key={courseId}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Course Header */}
                <div
                  onClick={() => toggleCourseCollapse(courseId)}
                  className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                      {course ? course.code : "N/A"}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900">
                      {course ? course.name : "Unassigned Course"}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      ({courseModules.length} module{courseModules.length > 1 ? "s" : ""})
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-semibold">
                    {isCollapsed ? "Expand +" : "Collapse −"}
                  </span>
                </div>

                {/* Modules in Course */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {courseModules.map((mod) => {
                      const fileExt = mod.file_key.split(".").pop() || "pdf";
                      return (
                        <div
                          key={mod.id}
                          onClick={() => setSelectedModuleForDetail(mod)}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs text-slate-900 hover:underline">
                                  {mod.title}
                                </h4>
                                <span
                                  className={`px-2 py-0.2 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                                    mod.is_published
                                      ? "bg-slate-900 text-white"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {mod.is_published ? (
                                    <>
                                      <Globe className="w-2.5 h-2.5" />
                                      <span>Published</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Draft</span>
                                    </>
                                  )}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {mod.description || "No description provided."}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                Uploaded: {new Date(mod.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                            {mod.download_url && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDoc({
                                      title: mod.title,
                                      fileUrl: mod.download_url!,
                                      fileExtension: fileExt,
                                      courseCode: course?.code,
                                    })
                                  }
                                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </button>

                                <a
                                  href={mod.download_url}
                                  download
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Download</span>
                                </a>
                              </>
                            )}

                            <button
                              type="button"
                              disabled={activeModuleId === mod.id}
                              onClick={() => handleTogglePublish(mod)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                                mod.is_published
                                  ? "border border-slate-200 text-slate-700 hover:bg-slate-100"
                                  : "bg-slate-900 text-white hover:bg-slate-800 shadow-xs"
                              }`}
                            >
                              {mod.is_published ? "Unpublish" : "Publish"}
                            </button>

                            <button
                              type="button"
                              disabled={activeModuleId === mod.id}
                              onClick={() => handleDelete(mod)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors"
                              title="Delete Module"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Module Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUploadSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Upload Learning Module</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Add course syllabus, lab guides, or lecture slides</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course *</label>
                <select
                  value={newModuleCourseId}
                  onChange={(e) => setNewModuleCourseId(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900"
                >
                  <option value="" disabled>Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Module Title *</label>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  required
                  placeholder="e.g. Modul 1: Dasar-dasar HTML & CSS"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Summary (Optional)</label>
                <textarea
                  value={newModuleDescription}
                  onChange={(e) => setNewModuleDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description of the topics..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Module File (.pdf, .docx) *</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-4 text-center bg-slate-50/50 transition-colors">
                  {selectedFile ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileCheck className="w-5 h-5 text-slate-800 shrink-0" />
                        <div className="text-left overflow-hidden">
                          <span className="font-semibold text-slate-900 block truncate">{selectedFile.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2">
                      <UploadCloud className="w-8 h-8 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800">
                        Click to browse or drag file here
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Supported formats: PDF, DOCX (Max 20MB)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile || !newModuleTitle.trim() || !newModuleCourseId}
                className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Module</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Module Detail Modal */}
      {selectedModuleForDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Banner */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Module Details</h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">Practicum learning file specifications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModuleForDetail(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Module Title
                </span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {selectedModuleForDetail.title}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Course
                </span>
                <span className="font-medium text-slate-800 block mt-0.5">
                  {selectedModuleForDetail.course_id && courseMap.get(selectedModuleForDetail.course_id)
                    ? `${courseMap.get(selectedModuleForDetail.course_id)?.code} - ${courseMap.get(selectedModuleForDetail.course_id)?.name}`
                    : "Unassigned"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Description
                </span>
                <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedModuleForDetail.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">File Key</span>
                  <span className="font-mono text-slate-800 truncate block mt-0.5" title={selectedModuleForDetail.file_key}>
                    {selectedModuleForDetail.file_key.split("/").pop()}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${selectedModuleForDetail.is_published ? "bg-slate-900" : "bg-slate-400"}`} />
                    {selectedModuleForDetail.is_published ? "Published to Students" : "Draft (Hidden)"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Storage Key (MinIO)</span>
                <span className="font-mono text-[11px] text-slate-600 truncate block mt-0.5" title={selectedModuleForDetail.file_key}>
                  {selectedModuleForDetail.file_key}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedModuleForDetail.download_url && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const course = selectedModuleForDetail.course_id
                            ? courseMap.get(selectedModuleForDetail.course_id)
                            : undefined;
                          setPreviewDoc({
                            title: selectedModuleForDetail.title,
                            fileUrl: selectedModuleForDetail.download_url!,
                            fileExtension: selectedModuleForDetail.file_key.split(".").pop() || "pdf",
                            courseCode: course?.code,
                          });
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={selectedModuleForDetail.download_url}
                        download
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={activeModuleId === selectedModuleForDetail.id}
                    onClick={() => handleTogglePublish(selectedModuleForDetail)}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-full font-semibold transition-colors"
                  >
                    {selectedModuleForDetail.is_published ? "Unpublish" : "Publish"}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={activeModuleId === selectedModuleForDetail.id}
                  onClick={() => handleDelete(selectedModuleForDetail)}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-full font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Browser Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          title={previewDoc.title}
          courseCode={previewDoc.courseCode}
          fileUrl={previewDoc.fileUrl}
          fileExtension={previewDoc.fileExtension}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
