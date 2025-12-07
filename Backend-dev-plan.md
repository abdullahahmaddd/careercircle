# Backend Development Plan — CareerCircle

## 1️⃣ Executive Summary
This project builds the backend for **CareerCircle**, a career management platform for students and early professionals. We will replace the existing frontend mock logic with a robust, persistent **FastAPI** backend connected to **MongoDB Atlas**.

**Key Constraints:**
- **Framework:** FastAPI (Python 3.13, async).
- **Database:** MongoDB Atlas (Motor driver, Pydantic v2 models).
- **Deployment:** No Docker, direct execution.
- **Workflow:** Single branch `main`, manual testing required per task.
- **Pagination:** None (not present in frontend UI).
- **Background Tasks:** Synchronous default, `BackgroundTasks` only if critical.

**Sprint Structure:**
- **S0:** Environment & Connectivity.
- **S1:** Authentication.
- **S2:** Resume Management (Master/Versions).
- **S3:** Playlists & Job Tracking.
- **S4:** Pods & Social Collaboration.

---

## 2️⃣ In-Scope & Success Criteria

### In-Scope Features
- User Signup, Login, Logout (JWT).
- Profile management (First application flag).
- Master Resume creation and updates.
- Version Resume creation (linked to Master).
- Syncing Version content back to Master.
- Playlist creation and management.
- Job Entry tracking (deadlines, status, parsed data).
- Pod creation and member invites (mock email).
- Sharing resumes within Pods.
- Commenting on shared resumes (async feedback).

### Success Criteria
- **End-to-End Functionality:** Frontend performs all actions against real API.
- **Persistence:** Data survives server restarts (MongoDB).
- **Verification:** All "Manual Test Steps" pass in the UI.
- **Clean Handoff:** Code pushed to `main` after each sprint.

---

## 3️⃣ API Design

**Base Path:** `/api/v1`  
**Error Format:** `{ "detail": "Error message" }`

### Auth
- `POST /auth/signup` — Create user, return token.
- `POST /auth/login` — Validate creds, return token.
- `GET /auth/me` — Get current user context.

### Resumes
- `GET /resumes` — List all resumes for current user.
- `POST /resumes` — Create Master or Version resume.
- `GET /resumes/{resume_id}` — Get specific resume.
- `PUT /resumes/{resume_id}` — Update resume content (used for Sync too).
- `DELETE /resumes/{resume_id}` — Delete resume.

### Playlists
- `GET /playlists` — List user's playlists (with embedded job entries).
- `POST /playlists` — Create new playlist.
- `DELETE /playlists/{playlist_id}` — Delete playlist.
- `POST /playlists/{playlist_id}/entries` — Add job entry.
- `PATCH /playlists/{playlist_id}/entries/{entry_id}` — Update status/details.
- `DELETE /playlists/{playlist_id}/entries/{entry_id}` — Remove job entry.

### Pods
- `GET /pods` — List pods user belongs to.
- `POST /pods` — Create a new pod.
- `POST /pods/{pod_id}/invite` — Add member (by email).
- `POST /pods/{pod_id}/share` — Share a version resume.
- `POST /pods/{pod_id}/shared/{shared_id}/comments` — Add comment.
- `DELETE /pods/{pod_id}/shared/{shared_id}/comments/{comment_id}` — Delete comment.

---

## 4️⃣ Data Model (MongoDB Atlas)

### `users`
- `_id`: ObjectId
- `name`: string
- `email`: string (unique)
- `hashed_password`: string
- `has_completed_first_application`: boolean (default: false)
- `created_at`: datetime

### `resumes`
- `_id`: ObjectId
- `user_id`: string (indexed)
- `type`: enum ("master", "version")
- `name`: string
- `content`: object (ParsedResume structure)
- `source_master_id`: string (optional, for versions)
- `job_description_id`: string (optional)
- `created_at`: datetime
- `last_modified_at`: datetime

### `playlists`
- `_id`: ObjectId
- `user_id`: string (indexed)
- `name`: string
- `job_entries`: array of objects
  - `id`: string (uuid)
  - `role_title`: string
  - `status`: string
  - `application_deadline`: string
  - `jd_text`: string (optional)
  - `parsed_jd`: object (optional)

### `pods`
- `_id`: ObjectId
- `owner_id`: string
- `name`: string
- `members`: array of objects (id, name, email)
- `shared_resumes`: array of objects
  - `id`: string (uuid)
  - `resume_owner_id`: string
  - `version_resume`: object
  - `comments`: array of objects (id, author_id, text, location, created_at)
- `created_at`: datetime

---

## 5️⃣ Frontend Audit & Feature Map

| Component/Context | Purpose | Backend Requirement | Auth |
|-------------------|---------|---------------------|------|
| `AuthContext` | User session, login, signup | `/auth/*` endpoints | Public/Protected |
| `ResumeContext` | CRUD Resumes, Sync logic | `/resumes` CRUD | Protected |
| `PlaylistContext` | Kanban board, Job tracking | `/playlists` + nested entries | Protected |
| `PodContext` | Collab, sharing, comments | `/pods` + nested actions | Protected |
| `Dashboard` | Overview stats | Derived from GETs above | Protected |

---

## 6️⃣ Configuration & ENV Vars

- `APP_ENV`: `development`
- `PORT`: `8000`
- `MONGODB_URI`: `mongodb+srv://...`
- `DB_NAME`: `careercircle`
- `JWT_SECRET`: `secure-random-string`
- `JWT_ALGORITHM`: `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `10080` (7 days)
- `CORS_ORIGINS`: `http://localhost:5173`

---

## 7️⃣ Testing Strategy (Manual via Frontend)

**Approach:**
- No dedicated backend test runner (e.g., pytest) required for this plan.
- Validation is performed strictly via the **Frontend UI**.
- Every task has a specific **Manual Test Step**.

**Workflow:**
1. Implement Backend Feature.
2. Update Frontend API calls (replace mocks).
3. **Execute Manual Test Step** in Browser.
4. If pass: Mark Task Done.
5. If fail: Debug & Fix.

---

## 🔟 Dynamic Sprint Plan & Backlog (S0 → S4)

### 🧱 S0 – Environment Setup & Frontend Connection

**Objectives:**
- Initialize FastAPI project.
- Connect to MongoDB Atlas.
- Setup CORS and Health check.

**Tasks:**
- [ ] **Setup Project Structure**
  - Create `main.py`, `database.py`, `config.py`.
  - Create `.gitignore`.
  - **Manual Test Step:** Run `python main.py` -> No errors.
  - **User Test Prompt:** "Start the server."

- [ ] **Database Connection**
  - Implement Motor client in `database.py`.
  - **Manual Test Step:** Check logs for "Connected to MongoDB".
  - **User Test Prompt:** "Verify console logs show DB connection."

- [ ] **Health Endpoint**
  - GET `/healthz` returns `{"status": "ok", "db": "connected"}`.
  - **Manual Test Step:** Browser -> `http://localhost:8000/healthz`.
  - **User Test Prompt:** "Visit health URL and confirm JSON response."

**Definition of Done:**
- Backend running on port 8000.
- Connected to remote Mongo Atlas.
- Git repo initialized and pushed to `main`.

---

### 🧩 S1 – Authentication & User Profile

**Objectives:**
- Secure the app with JWT.
- Persist users in MongoDB.

**Tasks:**
- [ ] **User Model & Signup API**
  - Schema: `UserCreate`, `UserInDB`.
  - POST `/auth/signup`.
  - **Manual Test Step:** UI Signup Page -> Enter details -> Submit -> Check Mongo Atlas for new document.
  - **User Test Prompt:** "Register a new user 'Test User' via the Signup form."

- [ ] **Login API & JWT**
  - POST `/auth/login`.
  - Return `access_token`.
  - **Manual Test Step:** UI Login Page -> Enter creds -> Redirect to Dashboard.
  - **User Test Prompt:** "Log out and log back in with the new account."

- [ ] **Get Current User (Me)**
  - GET `/auth/me`.
  - **Manual Test Step:** Refresh Dashboard -> User name appears in header.
  - **User Test Prompt:** "Refresh page and ensure you stay logged in."

- [ ] **Profile Update (First App Flag)**
  - PATCH `/auth/me` or specific endpoint to toggle `hasCompletedFirstApplication`.
  - **Manual Test Step:** Complete onboarding flow -> Check DB `has_completed_first_application` is true.
  - **User Test Prompt:** "Complete the 'First Application' wizard and check if state persists."

**Definition of Done:**
- User can sign up, login, maintain session, and update profile state.

---

### 📄 S2 – Resume Management

**Objectives:**
- CRUD for Master and Version resumes.
- "Review & Update" sync logic support.

**Tasks:**
- [ ] **Resume Models & CRUD**
  - POST / GET / PUT / DELETE `/resumes`.
  - **Manual Test Step:** Create Master Resume -> Verify in "My Resumes" list.
  - **User Test Prompt:** "Go to Resumes page and create a Master Resume."

- [ ] **Version Resume Logic**
  - POST `/resumes` with `type="version"`, `source_master_id`.
  - **Manual Test Step:** "Create Version" from Master -> Verify new card appears.
  - **User Test Prompt:** "Create a version resume tailored for 'Marketing'."

- [ ] **Sync Content (Update)**
  - PUT `/resumes/{id}` used for saving edits and syncing to master.
  - **Manual Test Step:** Edit Version -> Go to Master -> Click "Sync" -> Verify Master updated.
  - **User Test Prompt:** "Edit the version resume, then sync changes back to Master."

**Definition of Done:**
- Full Resume lifecycle functional in UI. Data persists in `resumes` collection.

---

### 📋 S3 – Playlists & Job Tracking

**Objectives:**
- Manage job applications.
- Track status and deadlines.

**Tasks:**
- [ ] **Playlist CRUD**
  - GET / POST / DELETE `/playlists`.
  - **Manual Test Step:** Create "Tech Jobs" playlist -> Verify it appears in sidebar/page.
  - **User Test Prompt:** "Create a new playlist named 'Tech Jobs'."

- [ ] **Job Entry Management**
  - POST / PATCH / DELETE entries within playlists.
  - **Manual Test Step:** Add Job from Dashboard -> Check Playlist -> Move card to "Applied".
  - **User Test Prompt:** "Add a job, then drag-and-drop it to a new status column."

- [ ] **Deadline Logic**
  - Ensure `application_deadline` is saved/retrieved correctly.
  - **Manual Test Step:** Set deadline for tomorrow -> Check "Upcoming Deadlines" widget.
  - **User Test Prompt:** "Add a job with tomorrow's deadline and check the dashboard alert."

**Definition of Done:**
- Kanban board operational. Job data persists.

---

### 🤝 S4 – Pods & Collaboration

**Objectives:**
- Social features: Pods, Sharing, Comments.

**Tasks:**
- [ ] **Pod CRUD & Invites**
  - POST `/pods`, POST `/pods/invite`.
  - **Manual Test Step:** Create Pod "Job Squad" -> Add Member (email).
  - **User Test Prompt:** "Create a Pod and invite a fake email."

- [ ] **Share Resume**
  - POST `/pods/{id}/share`.
  - **Manual Test Step:** "Share with Pod" from Resume Editor -> Check Pod view.
  - **User Test Prompt:** "Share your 'Marketing' resume to the 'Job Squad' pod."

- [ ] **Comments**
  - POST comment / DELETE comment.
  - **Manual Test Step:** Open shared resume -> Add comment -> Verify it sticks on refresh.
  - **User Test Prompt:** "Leave a feedback comment on the shared resume."

**Definition of Done:**
- Collaborative loop complete. All features from PRD implemented.