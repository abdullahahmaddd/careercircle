import requests
import sys
import json
import time

BASE_URL = "http://localhost:8002/api/v1"

def print_step(step):
    print(f"\n{'='*50}\n{step}\n{'='*50}")

def verify_sync():
    # 1. Signup/Login
    print_step("1. Authenticating")
    email = f"test_sync_{int(time.time())}@example.com"
    password = "password123"
    
    # Signup
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={
            "email": email,
            "name": "Sync Tester",
            "password": password
        })
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            print(f"Signed up as {email}")
        else:
            # Try login if signup fails (e.g. if I re-run quickly with same email logic, though time based should avoid)
            print(f"Signup failed ({resp.status_code}), trying login...")
            resp = requests.post(f"{BASE_URL}/auth/login", json={
                "email": email,
                "password": password
            })
            resp.raise_for_status()
            token = resp.json()["access_token"]
            print(f"Logged in as {email}")
            
    except Exception as e:
        print(f"Authentication failed: {e}")
        return False

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Master Resume
    print_step("2. Creating Master Resume")
    master_content = {
        "personal_info": {"name": "Master Name", "email": email},
        "experience": [{"title": "Software Engineer", "company": "Tech Corp"}],
        "education": [],
        "skills": ["Python", "FastAPI"],
        "projects": []
    }
    
    resp = requests.post(f"{BASE_URL}/resumes/", json={
        "name": "My Master Resume",
        "content": master_content,
        "type": "master"
    }, headers=headers)
    resp.raise_for_status()
    master_resume = resp.json()
    master_id = master_resume["_id"] if "_id" in master_resume else master_resume["id"]
    print(f"Created Master Resume: {master_id}")

    # 3. Create Version Resume
    print_step("3. Creating Version Resume")
    resp = requests.post(f"{BASE_URL}/resumes/", json={
        "name": "My Version Resume",
        "content": master_content,
        "type": "version",
        "source_master_id": master_id
    }, headers=headers)
    resp.raise_for_status()
    version_resume = resp.json()
    version_id = version_resume["_id"] if "_id" in version_resume else version_resume["id"]
    print(f"Created Version Resume: {version_id}")

    # Verify initial state
    if version_resume.get("is_unsynced", False):
        print("ERROR: New version resume should not be unsynced initially.")
        return False
    print("Initial state: is_unsynced = False (Correct)")

    # 4. Update Version Resume
    print_step("4. Updating Version Resume")
    new_content = master_content.copy()
    new_content["experience"].append({"title": "Senior Engineer", "company": "Startup Inc"})
    
    resp = requests.put(f"{BASE_URL}/resumes/{version_id}", json={
        "content": new_content
    }, headers=headers)
    resp.raise_for_status()
    updated_version = resp.json()
    
    # Verify is_unsynced became True
    if not updated_version.get("is_unsynced"):
        print("ERROR: Version resume should be is_unsynced=True after update.")
        print(f"Current state: {updated_version.get('is_unsynced')}")
        return False
    print("Update successful: is_unsynced = True (Correct)")

    # 5. Sync Version to Master
    print_step("5. Syncing Version to Master")
    resp = requests.post(f"{BASE_URL}/resumes/{master_id}/sync_from/{version_id}", headers=headers)
    resp.raise_for_status()
    synced_master = resp.json()
    
    # Verify Master Content
    master_exp = synced_master["content"].get("experience", [])
    if len(master_exp) != 2:
        print("ERROR: Master resume content was not updated.")
        print(f"Master Experience: {master_exp}")
        return False
    print("Master content updated successfully (Correct)")

    # 6. Verify Version is_unsynced is False
    print_step("6. Verifying Version State")
    resp = requests.get(f"{BASE_URL}/resumes/{version_id}", headers=headers)
    resp.raise_for_status()
    final_version = resp.json()
    
    if final_version.get("is_unsynced"):
        print("ERROR: Version resume should be is_unsynced=False after sync.")
        return False
    print("Final state: is_unsynced = False (Correct)")
    
    print("\nSUCCESS: All sync logic verified!")
    return True

if __name__ == "__main__":
    if verify_sync():
        sys.exit(0)
    else:
        sys.exit(1)