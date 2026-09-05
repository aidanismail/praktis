import os
import json
import uuid
import urllib.request
import http.cookiejar
try:
    import pytest
except ImportError:
    pytest = None

def get_base_url() -> str:
    if "BASE_URL" in os.environ:
        return os.environ["BASE_URL"]
    # If running inside docker container
    if os.path.exists("/.dockerenv"):
        return "http://nginx:80/api"
    # If running on local host machine
    return "http://localhost:8080/api"

BASE_URL = get_base_url()

def run_suite():
    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

    def request(method, path, body=None, custom_headers=None):
        url = f"{BASE_URL}{path}"
        data = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data, method=method)
        if body:
            req.add_header("Content-Type", "application/json")
        if custom_headers:
            for k, v in custom_headers.items():
                req.add_header(k, v)
        try:
            with opener.open(req) as resp:
                status_code = resp.status
                headers = dict(resp.headers)
                content = resp.read()
                try:
                    json_data = json.loads(content.decode("utf-8"))
                except Exception:
                    json_data = None
                return status_code, json_data, content, headers
        except urllib.error.HTTPError as e:
            content = e.read()
            try:
                json_data = json.loads(content.decode("utf-8"))
            except Exception:
                json_data = None
            return e.code, json_data, content, dict(e.headers)

    # 1. Health check & Middleware headers check
    status, data, _, headers = request("GET", "/health")
    print(f"1.  GET /health                               -> Status {status} (OK)")
    assert status == 200, f"Health check failed: {status}"
    assert "x-request-id" in headers or "X-Request-ID" in headers, "Missing X-Request-ID header"
    assert headers.get("x-frame-options", headers.get("X-Frame-Options")) == "DENY", "Missing X-Frame-Options"
    assert headers.get("x-content-type-options", headers.get("X-Content-Type-Options")) == "nosniff", "Missing X-Content-Type-Options"
    print("    ↳ [Verified] X-Request-ID and Security Headers attached successfully.")

    # 2. Login as Superadmin
    status, data, _, _ = request("POST", "/auth/login", {"username": "admin", "password": "aidanbagas123"})
    print(f"2.  POST /auth/login (admin)                  -> Status {status} (OK)")
    assert status == 200, f"Admin login failed: {status}"

    # 3. GET /auth/me (Admin)
    status, data, _, _ = request("GET", "/auth/me")
    print(f"3.  GET /auth/me (admin)                      -> Status {status} [Role: {data.get('role')}]")
    assert status == 200 and data.get("role") == "superadmin"

    # 3b. POST /auth/users (Create User)
    test_username = f"testuser_{uuid.uuid4().hex[:6]}"
    status, new_user_data, _, _ = request(
        "POST",
        "/auth/users",
        {
            "username": test_username,
            "email": f"{test_username}@unpad.ac.id",
            "role": "praktikan",
            "password": "Password123!",
        },
    )
    print(f"3b. POST /auth/users (admin)                  -> Status {status} (Created)")
    assert status == 201 and new_user_data.get("username") == test_username

    # 4. GET /courses (Admin)
    status, courses, _, _ = request("GET", "/courses/")
    print(f"4.  GET /courses                              -> Status {status} [Found: {len(courses)} courses]")
    assert status == 200 and len(courses) > 0
    target_course = courses[0]
    course_id = target_course["id"]

    # 5. GET /courses/{id}
    status, c_detail, _, _ = request("GET", f"/courses/{course_id}")
    print(f"5.  GET /courses/{{id}} ({target_course['code']})            -> Status {status} (OK)")
    assert status == 200

    # 6. GET /courses/{id}/students
    status, students, _, _ = request("GET", f"/courses/{course_id}/students")
    print(f"6.  GET /courses/{{id}}/students                -> Status {status} [Enrolled: {len(students)} students]")
    assert status == 200

    # 7. GET /courses/{id}/staff
    status, staff, _, _ = request("GET", f"/courses/{course_id}/staff")
    print(f"7.  GET /courses/{{id}}/staff                   -> Status {status} [Staff: {len(staff)} asprak]")
    assert status == 200

    # 8. GET /courses/{id}/sessions
    status, sessions, _, _ = request("GET", f"/courses/{course_id}/sessions")
    print(f"8.  GET /courses/{{id}}/sessions                -> Status {status} [Sessions: {len(sessions)}]")
    assert status == 200
    session_id = sessions[0]["id"] if sessions else None

    # 9. GET /courses/{id}/announcements
    status, announcements, _, _ = request("GET", f"/courses/{course_id}/announcements")
    print(f"9.  GET /courses/{{id}}/announcements           -> Status {status} [Announcements: {len(announcements)}]")
    assert status == 200
    ann_id = announcements[0]["id"] if announcements else None

    # 10. POST /courses/{id}/announcements (New Announcement)
    status, new_ann, _, _ = request(
        "POST",
        f"/courses/{course_id}/announcements",
        {
            "title": "API Test Broadcast Announcement",
            "content": "This is an automated test announcement generated by the API mock test suite.",
            "is_pinned": False,
        }
    )
    print(f"10. POST /courses/{{id}}/announcements          -> Status {status} (Created)")
    assert status == 201
    created_ann_id = new_ann["id"]

    # 11. POST /courses/{id}/announcements/{ann_id}/comments
    status, new_comment, _, _ = request(
        "POST",
        f"/courses/{course_id}/announcements/{created_ann_id}/comments",
        {"content": "Automated verification comment"}
    )
    print(f"11. POST /announcements/{{id}}/comments          -> Status {status} (Created)")
    assert status == 201

    # 11b. DELETE /courses/{id}/announcements/{ann_id}/comments/{comment_id}
    if new_comment and "id" in new_comment:
        status, _, _, _ = request(
            "DELETE",
            f"/courses/{course_id}/announcements/{created_ann_id}/comments/{new_comment['id']}"
        )
        print(f"11b. DELETE /announcements/{{id}}/comments/{{id}} -> Status {status} (Deleted)")
        assert status == 204

    # 12. GET /courses/{id}/assignments
    status, assignments, _, _ = request("GET", f"/courses/{course_id}/assignments")
    print(f"12. GET /courses/{{id}}/assignments            -> Status {status} [Assignments: {len(assignments)}]")
    assert status == 200
    assign_id = assignments[0]["id"] if assignments else None

    # 13. POST /courses/{id}/assignments
    status, new_assign, _, _ = request(
        "POST",
        f"/courses/{course_id}/assignments",
        {
            "title": "API Automated Lab Assignment",
            "description": "Automated test assignment submission prompt",
            "max_points": 100,
            "allowed_file_types": "pdf,zip",
            "is_published": True,
        }
    )
    print(f"13. POST /courses/{{id}}/assignments           -> Status {status} (Created)")
    assert status == 201

    # 14. GET /courses/{id}/assignments/{id}/submissions
    if assign_id:
        status, submissions, _, _ = request("GET", f"/courses/{course_id}/assignments/{assign_id}/submissions")
        print(f"14. GET /assignments/{{id}}/submissions        -> Status {status} [Submissions: {len(submissions)}]")
        assert status == 200
        if submissions:
            sub_id = submissions[0]["id"]
            # 15. Grade submission
            status, grade_data, _, _ = request(
                "POST",
                f"/courses/{course_id}/assignments/{assign_id}/submissions/{sub_id}/grade",
                {"score": 95.0, "feedback": "Excellent work (API Test)"}
            )
            print(f"15. POST /submissions/{{id}}/grade             -> Status {status} (Score: {grade_data.get('score')})")
            assert status == 200

    # 16. GET /modules
    status, modules, _, _ = request("GET", f"/modules?course_id={course_id}")
    print(f"16. GET /modules                              -> Status {status} [Modules: {len(modules)}]")
    assert status == 200

    # 17. GET /attendance/sessions/{session_id}
    if session_id:
        status, att_data, _, _ = request("GET", f"/attendance/sessions/{session_id}")
        print(f"17. GET /attendance/sessions/{{id}}           -> Status {status} [Records: {len(att_data)}]")
        assert status == 200

        if students:
            # 17a. POST /attendance/sessions/{session_id}/bulk (Admin override test)
            status, bulk_res, _, _ = request(
                "POST",
                f"/attendance/sessions/{session_id}/bulk",
                {"records": [{"student_id": students[0]["id"], "status": "hadir"}]}
            )
            print(f"17a. POST /attendance/sessions/{{id}}/bulk     -> Status {status} ({bulk_res.get('message')})")
            assert status == 200

    # 17b. Student Enrollment & Unenrollment Verification
    if students:
        test_student_id = students[0]["id"]
        status, _, _, _ = request("DELETE", f"/courses/{course_id}/students/{test_student_id}")
        print(f"17b. DELETE /courses/{{id}}/students/{{id}}     -> Status {status} (Unenrolled)")
        assert status == 204
        # Re-enroll student back
        status, _, _, _ = request("POST", f"/courses/{course_id}/enroll", {"usernames": [students[0]["username"]]})
        assert status == 200

    # 18. GET /grades/sessions/{session_id}
    if session_id:
        status, gr_data, _, _ = request("GET", f"/grades/sessions/{session_id}")
        print(f"18. GET /grades/sessions/{{id}}               -> Status {status} [Grades: {len(gr_data)}]")
        assert status == 200

    # 18b. GET /attendance/me and /grades/me
    status, my_att, _, _ = request("GET", "/attendance/me")
    print(f"18b. GET /attendance/me                       -> Status {status} [Records: {len(my_att) if isinstance(my_att, list) else 0}]")
    assert status == 200

    status, my_gr, _, _ = request("GET", "/grades/me")
    print(f"18c. GET /grades/me                           -> Status {status} [Records: {len(my_gr) if isinstance(my_gr, list) else 0}]")
    assert status == 200

    # 18d. Class Session Lifecycle (Open & Close attendance)
    if session_id:
        status, open_res, _, _ = request("POST", f"/class-sessions/{session_id}/open-attendance")
        print(f"18d. POST /class-sessions/{{id}}/open-attendance -> Status {status}")
        assert status in [200, 400] # 200 if opened, 400 if already open

        status, close_res, _, _ = request("POST", f"/class-sessions/{session_id}/close-attendance")
        print(f"18e. POST /class-sessions/{{id}}/close-attendance -> Status {status}")
        assert status in [200, 400]

        # 18f. DELETE /class-sessions/{session_id} (Create disposable session and delete it)
        status, temp_sess, _, _ = request(
            "POST",
            f"/courses/{course_id}/sessions",
            {"title": "Temporary Disposable Session", "date": "2026-09-01"},
        )
        if status in [200, 201]:
            temp_sess_id = temp_sess["id"]
            del_st, _, _, _ = request("DELETE", f"/class-sessions/{temp_sess_id}")
            print(f"18f. DELETE /class-sessions/{{id}}            -> Status {del_st} (Deleted)")
            assert del_st == 204

    # 19. GET /export/attendance/{session_id}?format=csv
    if session_id:
        status, _, raw_csv, _ = request("GET", f"/export/attendance/{session_id}?format=csv")
        print(f"19. GET /export/attendance/{{id}} (CSV)       -> Status {status} [Bytes: {len(raw_csv)}]")
        assert status == 200

    # 20. GET /export/grades/{session_id}?format=xlsx
    if session_id:
        status, _, raw_xlsx, _ = request("GET", f"/export/grades/{session_id}?format=xlsx")
        print(f"20. GET /export/grades/{{id}} (XLSX)          -> Status {status} [Bytes: {len(raw_xlsx)}]")
        assert status == 200

    # 21. POST /auth/logout
    status, _, _, _ = request("POST", "/auth/logout")
    print(f"21. POST /auth/logout                         -> Status {status} (Logged out)")
    assert status == 200

    # 22. Rate Limit Verification (Spamming requests from simulated attacker IP)
    print("\n--- Rate Limiter Verification (Anti-Brute Force) ---")
    spoofed_ip = f"192.168.200.{uuid.uuid4().int % 250 + 1}"
    rate_limited = False
    for attempt in range(1, 12):
        st, d, _, h = request(
            "POST",
            "/auth/login",
            {"username": "attacker", "password": "wrongpassword"},
            custom_headers={"X-Forwarded-For": spoofed_ip}
        )
        if st == 429:
            print(f"↳ Attempt #{attempt}: HTTP 429 Rate Limit Tripped successfully! Retry-After: {h.get('retry-after', h.get('Retry-After'))}s")
            rate_limited = True
            break
    assert rate_limited, "Rate limiter did not trigger 429 Too Many Requests"

    try:
        import redis
        redis_host = "cache" if os.path.exists("/.dockerenv") else "localhost"
        r = redis.Redis(host=redis_host, port=6379, db=0, socket_timeout=2)
        keys = r.keys("rate_limit:login:*")
        if keys:
            r.delete(*keys)
        print("    ↳ [Cleaned] Flushed login rate limit test keys in Redis.")
    except Exception:
        pass

    
def test_live_api_suite():
    """Pytest entrypoint for running the live integration test suite."""
    run_suite()

if __name__ == "__main__":
    run_suite()
