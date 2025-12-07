import requests
import sys

# BASE_URL = "http://localhost:8001"
BASE_URL = "http://localhost:8002" # Try 8002 as it seems to be the active one in previous turn or I can try both.
# Terminal 2 is 8001, Terminal 15 is 8002. Usually the latest one is the one to check, or maybe they are different services.
# Let's try 8001 first as it seems to be the main one from previous context? Or 8002?
# The environment details show both active. I'll try 8001.

def test_pods(port):
    base_url = f"http://localhost:{port}"
    print(f"Testing port {port}...")
    
    # Login
    login_data = {
        "username": "test@example.com", # Assuming this user exists or I should create one
        "password": "password123"
    }
    
    # Try to register first just in case
    try:
        reg_data = {"email": "test@example.com", "password": "password123", "name": "Test User"}
        requests.post(f"{base_url}/auth/register", json=reg_data)
    except:
        pass

    try:
        response = requests.post(f"{base_url}/auth/token", data=login_data)
        if response.status_code != 200:
            print(f"Login failed on {port}: {response.text}")
            return

        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a pod to ensure we have one
        pod_data = {"name": "Test Pod"}
        create_resp = requests.post(f"{base_url}/pods/", json=pod_data, headers=headers)
        print(f"Create Pod Response: {create_resp.status_code} - {create_resp.text}")

        # List pods
        response = requests.get(f"{base_url}/pods/", headers=headers)
        print(f"List Pods Response Status: {response.status_code}")
        print(f"List Pods Response Body: {response.text}")
        
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            print("First pod keys:", data[0].keys())
            if "_id" in data[0]:
                print("Found _id in response")
            if "id" in data[0]:
                print("Found id in response")
        else:
            print("No pods found in list")

    except Exception as e:
        print(f"Error testing port {port}: {e}")

if __name__ == "__main__":
    test_pods(8001)
    print("-" * 20)
    test_pods(8002)