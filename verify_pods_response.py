import requests
import sys

# The backend seems to be running on 8002 based on active terminals
BASE_URL = "http://localhost:8002/api/v1"

def test_pods():
    print(f"Testing API at {BASE_URL}...")
    
    # Login
    login_data = {
        "email": "test@example.com", 
        "password": "password123"
    }
    
    # Register if needed
    try:
        reg_data = {"email": "test@example.com", "password": "password123", "name": "Test User"}
        requests.post(f"{BASE_URL}/auth/signup", json=reg_data)
    except:
        pass

    try:
        # Login
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            # Try to signup if login failed
            print("Attempting signup...")
            reg_resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": "test@example.com", "password": "password123", "name": "Test User"})
            if reg_resp.status_code == 200:
                 response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
            else:
                 print(f"Signup failed: {reg_resp.text}")
                 return

        if response.status_code != 200:
             print("Login failed after signup attempt")
             return

        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get Current User to see ID
        me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        me_data = me_resp.json()
        print(f"Current User: {me_data}")
        current_user_id = me_data.get("id") or me_data.get("_id")
        print(f"Current User ID: {current_user_id}")

        # Create a pod to ensure we have one owned by this user
        pod_data = {"name": "Test Pod Owner Check"}
        create_resp = requests.post(f"{BASE_URL}/pods/", json=pod_data, headers=headers)
        print(f"Create Pod Response: {create_resp.status_code}")

        # List pods
        response = requests.get(f"{BASE_URL}/pods/", headers=headers)
        print(f"List Pods Response Status: {response.status_code}")
        
        pods = response.json()
        if isinstance(pods, list) and len(pods) > 0:
            print(f"Found {len(pods)} pods")
            first_pod = pods[0]
            print("First pod data:", first_pod)
            
            owner_id = first_pod.get("owner_id")
            print(f"Pod owner_id: {owner_id}")
            print(f"Match? {str(owner_id) == str(current_user_id)}")
            
            # Check keys
            print("Keys in pod response:", first_pod.keys())
        else:
            print("No pods found in list")

    except Exception as e:
        print(f"Error testing: {e}")

if __name__ == "__main__":
    test_pods()