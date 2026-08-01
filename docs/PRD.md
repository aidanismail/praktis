# Praktis Product Requirements

## Document status

- Product: **Praktis — Praktikum Management System**
- Original working title: Asprak Management System
- Started: June 13, 2026
- Product status: in progress
- Target release: TBD
- Product and frontend lead: Aidan
- Backend lead: Bagas

This document distills the supplied PRD and later owner decisions. Later explicit owner decisions override the original PRD when they conflict.

## Background

Informatics practicum administration has relied on newly created email, Google Drive, and Classroom accounts with limited storage. Accounts change across semesters and years, which fragments modules, attendance data, grades, credentials, and operational ownership.

Praktis centralizes practicum administration on university-managed infrastructure and replaces recurring account/storage work with one durable system.

## Product goals

- Eliminate recurring practicum storage-account creation.
- Centralize practicum modules, attendance, grades, and account administration.
- Reduce accidental data loss caused by fragmented account ownership.
- Reduce attendance and grade recap/export time to under one minute where feasible.
- Support active use across Informatics practicum classes.
- Provide a maintainable foundation for future practicum functionality.

## Active roles

### Superadmin

System-level administration, user import, account management, and global configuration.

Ownership note: Bagas owns the superadmin product area. The frontend agent must not implement it unless Aidan explicitly assigns the task.

### Asprak

- access assigned practicum classes
- upload and manage learning modules
- record attendance using `Hadir`, `Sakit`, `Izin`, and `Alfa`
- input and manage practicum grades
- export or review relevant class records

Ownership note: Aidan owns this product area.

### Praktikan

- authenticate using a generated account
- change the default password on first login when required
- view enrolled practicum classes
- view or download learning modules
- view personal attendance
- view released grades
- view account/profile information

Ownership note: Aidan owns this product area.

### Excluded role

`Dosen Pengampu` is not an application role in the current scope. Do not add it without a new owner decision.

## Core features

### Authentication and user access

- Login using backend-managed session cookies.
- First-login password change applies to `praktikan` when `force_password_change` is true.
- Role-aware routing and navigation.
- Logout invalidates the backend session cookie and clears client user state.

### Student import

Superadmin can import student records from CSV or XLSX, map NPM to usernames, generate default passwords, and receive a result summary.

This area is outside Aidan's default agent scope.

### Module management

- Asprak can upload module files.
- Supported product formats are PDF and Word documents.
- Current backend configuration limits module uploads to 25 MiB.
- Praktikan can view and download modules for enrolled classes.
- Upload interfaces should show pending, success, and failure states.

### Attendance

- Asprak sees the class roster for a specific attendance session.
- Each student can be marked `Hadir`, `Sakit`, `Izin`, or `Alfa`.
- Status interaction updates immediately in the UI.
- Attendance is explicitly saved and confirmed.
- Praktikan can view personal attendance history/status.

### Grading and reporting

- Asprak can enter practicum/task grades.
- Praktikan can view released grades.
- Relevant records can be exported to CSV or XLSX where supported by the backend.

## High-priority user journeys

### Praktikan first login and module access

1. Login.
2. If `force_password_change` is true, block protected application access and redirect to change-password.
3. After successful password change, enter the Praktikan dashboard.
4. View enrolled practicum classes.
5. Open a class and view/download available modules.

### Asprak attendance recording

1. Open the Asprak dashboard.
2. Select an assigned practicum class.
3. Open an attendance session.
4. Mark every student with one attendance status.
5. Save.
6. Receive a clear success or failure result.

### Asprak module upload

1. Open an assigned class.
2. Open its module area.
3. Start upload from a visible action.
4. Enter title and description, then choose a valid file.
5. Show progress/pending state.
6. Append the saved module to the list without a full-page reload.

## UX direction

- Professional, academic, clean, and speed-oriented.
- Admin-dashboard layout with left navigation and right content area.
- Minimize full-page loading.
- Use dialogs or drawers for focused creation/edit workflows where appropriate.
- Provide responsive behavior and accessible controls.

## Success metrics

### Primary

- No new Google Drive account is required for practicum file storage after launch.
- All active Informatics practicum classes adopt Praktis.
- No loss of grade, attendance, or module data due to fragmented account management.

### Secondary

- Attendance/grade export time is reduced to under one minute where the workflow supports one-click export.
- At least 80% of Praktikan users actively access modules before weekly practicum sessions.
- Target critical-hours uptime: 99.9% after production deployment and monitoring are established.

## Out of scope for the current phase

- Dosen role
- quizzes, midterms, finals, or full LMS functionality
- secure-exam-browser behavior
- production deployment automation before the university server is provisioned
- unapproved backend or superadmin work by the frontend agent
