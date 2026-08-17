"use client";

import { useEffect, useState } from "react";
import {
  X,
  AlertCircle,
  CheckCircle2,
  Plus,
  UserPlus,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import {
  fetchAdminUsers,
  fetchAdminCourses,
  createAdminUser,
  assignCourseStaff,
  enrollCourseStudents,
  resetUserPassword,
} from "../api/admin.api";
import type { User } from "@/types/user.type";
import type { Course } from "@/features/courses/types/course.type";

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit / Assign Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState("");
  const [assignRole, setAssignRole] = useState<"praktikan" | "asprak">("praktikan");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"praktikan" | "asprak" | "superadmin">("praktikan");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

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
      const [uData, cData] = await Promise.all([
        fetchAdminUsers().catch(() => []),
        fetchAdminCourses().catch(() => []),
      ]);
      setUsers(uData);
      setCourses(cData);
      if (cData.length > 0) {
        setTargetCourseId(cData[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const [uData, cData] = await Promise.all([
          fetchAdminUsers().catch(() => []),
          fetchAdminCourses().catch(() => []),
        ]);
        if (isMounted) {
          setUsers(uData);
          setCourses(cData);
          if (cData.length > 0) {
            setTargetCourseId(cData[0].id);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load users");
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);

    const trimmedUsername = newUsername.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedUsername) {
      setCreateUserError("Username is required.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setCreateUserError("Please enter a valid email address.");
      return;
    }
    if (newPassword.length < 8) {
      setCreateUserError("Password must be at least 8 characters long.");
      return;
    }

    setIsCreatingUser(true);
    try {
      await createAdminUser({
        username: trimmedUsername,
        email: trimmedEmail,
        role: newRole,
        password: newPassword,
      });

      setShowCreateUserModal(false);
      setNewUsername("");
      setNewEmail("");
      setNewRole("praktikan");
      setNewPassword("");
      setActionSuccess(`Successfully created ${newRole} account for '${trimmedUsername}'.`);
      await loadData();
    } catch (err: unknown) {
      setCreateUserError(err instanceof Error ? err.message : "Failed to create user account.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (id: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUserIds(next);
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Reset password for '${user.username}'? Default password will be set.`)) return;

    setError(null);
    setActionSuccess(null);

    try {
      const res = await resetUserPassword(user.id);
      setActionSuccess(res.message || `Password for ${user.username} reset successfully.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    }
  };

  const handleApplyCourseAssign = async () => {
    if (!targetCourseId || selectedUserIds.size === 0) return;

    setIsSubmitting(true);
    setError(null);
    setActionSuccess(null);

    const selectedUsers = users.filter((u) => selectedUserIds.has(u.id));
    const usernames = selectedUsers.map((u) => u.username);

    try {
      if (assignRole === "asprak") {
        const res = await assignCourseStaff(targetCourseId, usernames);
        setActionSuccess(res.message || "Assigned staff successfully.");
      } else {
        const res = await enrollCourseStudents(targetCourseId, usernames);
        setActionSuccess(res.message || "Enrolled students successfully.");
      }
      setShowEditModal(false);
      setSelectedUserIds(new Set());
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to perform course assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role summary counts
  const roleCounts = {
    all: users.length,
    superadmin: users.filter((u) => u.role === "superadmin").length,
    asprak: users.filter((u) => u.role === "asprak").length,
    praktikan: users.filter((u) => u.role === "praktikan").length,
  };

  // Filter users based on role and search query
  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Alert Messages */}
      {actionSuccess && (
        <div className="rounded-xl bg-slate-900 border border-slate-200 px-4 py-3 text-xs font-medium text-white flex items-center justify-between shadow-xs">
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
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google Admin Style Filter Chips & Search / Add User Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Role Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "superadmin", "asprak", "praktikan"] as const).map((r) => {
            const isSelected = filterRole === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setFilterRole(r)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {r} <span className="opacity-75 font-normal">({roleCounts[r]})</span>
              </button>
            );
          })}
        </div>

        {/* Right Action: Search Input & Add User Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-60 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setNewUsername("");
              setNewEmail("");
              setNewRole("praktikan");
              setNewPassword("");
              setCreateUserError(null);
              setShowCreateUserModal(true);
            }}
            className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Bulk Action Bar */}
        {selectedUserIds.size > 0 ? (
          <div className="flex items-center justify-between bg-slate-100 border-b border-slate-200 px-6 py-3">
            <span className="text-xs font-semibold text-slate-900">
              {selectedUserIds.size} user account(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserIds(new Set())}
                className="rounded-full px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white transition-colors"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
              >
                Enroll / Assign to Course
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No users match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        filteredUsers.length > 0 &&
                        filteredUsers.every((u) => selectedUserIds.has(u.id))
                      }
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                  </th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.has(user.id);
                  const initial = user.username.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{user.username}</span>
                            <span className="text-[11px] text-slate-500">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                            user.role === "superadmin"
                              ? "bg-slate-900 text-white"
                              : user.role === "asprak"
                                ? "bg-slate-200 text-slate-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create New User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-apple-modal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-slate-800" />
                  <span>Create New User Account</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Add a student, teaching assistant, or admin account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs apple-press transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createUserError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 animate-apple-fade">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username / NPM <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 140810220001 or johndoe"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@unpad.ac.id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  System Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["praktikan", "asprak", "superadmin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize border apple-press transition-all duration-150 text-center ${
                        newRole === r
                          ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 pr-9 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Students will be asked to change their password on first login.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 apple-press transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 apple-press transition-all flex items-center gap-1.5"
                >
                  {isCreatingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreatingUser ? "Creating..." : "Create User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-apple-modal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900">
                Assign {selectedUserIds.size} User(s) to Course
              </h4>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs apple-press transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Course
                </label>
                <select
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.academic_year} {c.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assignment Role
                </label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value as "praktikan" | "asprak")}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
                >
                  <option value="praktikan">Enroll as Student (Praktikan)</option>
                  <option value="asprak">Assign as Teaching Assistant (Asprak)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 apple-press transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCourseAssign}
                disabled={isSubmitting || !targetCourseId}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 apple-press transition-all"
              >
                {isSubmitting ? "Saving..." : "Apply Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
