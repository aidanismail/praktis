# Praktis Product Requirements

## Document status

- Product: **Praktis — Praktikum Management System**
- Original working title: Asprak Management System
- Started: June 13, 2026
- Product status: in progress
- Target release: TBD
- Product lead and Asprak/Praktikan frontend integration: Aidan
- Backend and Superadmin frontend integration: Bagas
- Last product-decision update: August 17, 2026

This document defines intended product behavior. It does not imply every requirement is implemented. `docs/API_CONTRACT_STATUS.md` records current operation-level readiness, and `docs/FULL_STACK_WORKFLOW.md` defines the integration process. Later explicit owner decisions override earlier requirements when they conflict.

## Background

Informatics practicum administration has historically relied on newly created email, Google Drive, and Classroom accounts with limited storage. Accounts change across semesters and years, fragmenting modules, attendance, grades, credentials, and operational ownership.

Praktis centralizes practicum administration on university-managed infrastructure and provides a durable, intuitive Google Classroom style experience across academic periods.

## Product goals

- Eliminate recurring practicum storage-account creation.
- Centralize modules, assignments, student submissions, attendance, grades, course offerings, and account administration.
- Provide a modern, clean Google Classroom aesthetic with dual Card Grid and Table views.
- Reduce attendance and grade recap/export time to under one minute.
- Support active Informatics practicum classes and retain prior academic-period records.

## Initial operating scale

- Approximately 20 active practicum courses
- More than 200 Praktikan users in total across those courses
- Approximately 8-10 modules per course
- Multi-year retention is expected; history APIs are designed to remain bounded as data grows.

## Academic-period course model

A course record represents one practicum offering in a specific academic period (e.g. `IF2101 - Algoritma dan Pemrograman (2025/2026 Ganjil)`).

Uniqueness is enforced on `(code, academic_year, semester)`. Historical offerings remain identifiable without appearing active accidentally.

## Active roles

### Superadmin

System-level administration, user import, account management, course/enrollment/staff administration, and global platform supervision.

### Asprak

For assigned practicum courses, Asprak may:

- view course offerings, roster, and assignments
- create, edit, pin, and delete course stream announcements
- create, edit, publish, and delete learning modules and classwork assignments
- grade student assignment submissions with numeric scores and written feedback
- create, edit/reschedule, and manage class sessions and live attendance windows
- record attendance using `Hadir`, `Sakit`, `Izin`, and `Alfa`
- enter, publish, unpublish, correct, and republish grades per class session
- export supported records (.CSV and .XLSX)

### Praktikan

- authenticate using an imported account
- change the temporary password on first login when required
- view enrolled academic-period course offerings
- read course stream announcements and participate in threaded Q&A comments
- view or download visible learning modules
- submit assignment solution files (PDF/ZIP/DOCX) with automatic late detection
- view personal attendance logs
- view only grades from published class sessions and graded assignments
- view account/profile information

### Excluded role

`Dosen Pengampu` is not an application role.

## Core features

### 1. Google Classroom Information Architecture
- **Dual Course Presentation**: Toggle between visual **Classroom Card Grid** (with semester banners, assistant info, and direct links) and **Compact Data Table**.
- **Course Workspace (4-Tab Modal/Drawer)**:
  1. **Stream**: Course metadata, academic period, status, and broadcast announcements.
  2. **Classwork**: Grouped learning modules (PDF download links and publish toggles) and assignments.
  3. **People**: Teaching Assistants (*Asprak*) and Enrolled Students (*Praktikan*) rosters with avatar initials.
  4. **Sessions & Attendance**: Meeting logs with attendance window status controls.

### 2. Stream Announcements & Discussions
- Broadcast updates to the course stream with pin-to-top capability.
- Threaded discussion comments below each post for interactive student Q&A.

### 3. Classwork Assignments & Student Submissions
- Assignments with instructions, due date, max points, and allowed extensions.
- Direct multipart file uploads (up to 10MB) to MinIO object storage.
- Automatic late calculation when `submitted_at > due_date`.
- Grading interface for Aspraks to assign scores and private written feedback.

### 4. Module Management
- Supported formats: PDF and DOCX (up to 25 MiB).
- Presigned upload and download flows via MinIO.
- Publish and draft status toggles.

### 5. Attendance & Grading
- Per-session attendance windows (*Open* / *Locked*).
- Status recording (*Hadir, Sakit, Izin, Alfa*).
- Session grade publication controls ensuring student grade privacy.
- One-click CSV and XLSX export.

## UX direction

- Clean Google Classroom aesthetic with Material 3 styling
- Minimal, purposeful transitions (`transition-colors duration-150`, `active:scale-[0.99]`)
- Restrained monochromatic neutral palette with Google Emerald active accents
- Clear visual state indicators for attendance windows and publication status

## Success metrics

- No external storage account required for practicum operations.
- All active Informatics practicum offerings adopt Praktis.
- Zero loss of grade, attendance, module, or assignment data.
- Attendance/grade export completes in under one minute.
