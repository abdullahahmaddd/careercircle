# Technical Specification: "Review & Update" Sync Logic

## Overview
This specification details the changes required to implement server-side tracking of "unsynced" changes between Version and Master resumes. This ensures that when a user edits a tailored Version resume, the system flags it as having changes that may need to be synced back to the Master resume.

## 1. Backend Changes

### 1.1. Database Models (`backend/models.py`)

**Goal:** Persist the "dirty" state of a resume.

*   **Modify `ResumeInDB`**:
    *   Add field `is_unsynced: bool = False`.
    *   This field indicates if a Version resume has modifications that haven't been pushed to the Master resume.

```python
class ResumeInDB(ResumeBase):
    # ... existing fields ...
    is_unsynced: bool = False  # New field
```

### 1.2. API Routes (`backend/routes/resumes.py`)

**Goal:** Automatically flag updates and provide a mechanism to sync.

*   **Update `PUT /resumes/{resume_id}`**:
    *   **Logic:** When a resume is updated:
        *   If `existing_resume.type == ResumeType.VERSION`:
            *   Set `update_data["is_unsynced"] = True`.
        *   (Edge Case): If the user explicitly passes `is_unsynced` in the body (unlikely but possible), the server logic should override it to `True` on content changes, or we can just rely on the server logic.
    *   **Implementation Note:** Ensure `last_modified_at` is also updated (already exists).

*   **New Endpoint `POST /resumes/{master_id}/sync_from/{version_id}`**:
    *   **Method:** `POST`
    *   **Path:** `/resumes/{master_id}/sync_from/{version_id}`
    *   **Access:** Protected (CurrentUser).
    *   **Logic:**
        1.  Fetch `master_resume` by `master_id` and ensure ownership. Verify `type == MASTER`.
        2.  Fetch `version_resume` by `version_id` and ensure ownership. Verify `type == VERSION`.
        3.  **Validation:** Ideally, check if `version_resume.source_master_id == master_id` (if we are strictly enforcing hierarchy). If not, we can still allow it but perhaps log a warning. Let's enforce it if `source_master_id` is available.
        4.  **Action:**
            *   Update `master_resume.content` = `version_resume.content`.
            *   Update `master_resume.last_modified_at` = `datetime.utcnow()`.
            *   Update `version_resume.is_unsynced` = `False`.
            *   Save both to DB.
    *   **Response:** Return the updated `Master` resume (model: `ResumeResponse`).

## 2. Frontend Changes

### 2.1. Types & Parsing (`frontend/src/context/ResumeContext.tsx`)

*   **Update `Resume` Interface:**
    *   Add `isUnsynced: boolean;`.

*   **Update `mapResume` function:**
    *   Map `apiResume.is_unsynced` to `isUnsynced`. (Handle case where field might be missing in older records -> default to `false`).

### 2.2. Context Logic (`frontend/src/context/ResumeContext.tsx`)

*   **Update `syncVersionToMaster`**:
    *   **Current:** Calls `updateMasterResumeContent` (PUT /resumes/{id}).
    *   **New:** Call `POST /resumes/{masterId}/sync_from/{versionId}`.
    *   **State Update:**
        *   Update local `masterResume` state with the response.
        *   Update local `versionResumes` state: Find the specific version resume and set its `isUnsynced` to `false`.

*   **Update `updateVersionResumeContent`**:
    *   The API response from `PUT` will now include `is_unsynced=true`.
    *   Ensure the local state update (`setVersionResumes`) captures this new flag from the response.

## 3. Migration Strategy (if applicable)

*   Existing resumes in MongoDB won't have the `is_unsynced` field.
*   **Strategy:** The model default `False` handles this. When an old resume is read, Pydantic/Mongo mapping will see it as `False` (or we ensure the code handles missing keys gracefully, typically Pydantic defaults work if we set `default=False`).
*   No explicit database migration script is strictly needed for this scale; "lazy" migration via defaults is acceptable.

## 4. Verification Plan

1.  **Create Version:** Create a new version resume from a master. Check `is_unsynced` is `False`.
2.  **Edit Version:** Edit the version resume. Check `is_unsynced` becomes `True` in DB and UI.
3.  **Sync:** Click "Sync to Master".
    *   Master should now have the Version's content.
    *   Version's `is_unsynced` should become `False`.