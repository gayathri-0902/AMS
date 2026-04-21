import requests
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

url = "http://127.0.0.1:5001/api/query"
payload = {
    "query": "What are the types of conflict explained in Organizational Behaviour?",
    "year": 4,
    "branch": "DS",
    "student_name": "Test Student"
}

print(f"Testing Student Academic AI Endpoint: {url}")
print(f"Payload: {payload}\n")

try:
    response = requests.post(url, json=payload, stream=True, timeout=180)
    print(f"HTTP Status: {response.status_code}")

    if response.status_code != 200:
        print(f"Error body: {response.text}")
        sys.exit(1)

    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            if decoded_line.startswith("data: "):
                try:
                    data = json.loads(decoded_line[6:])
                    if data.get('status') == 'token':
                        print(data['token'], end='', flush=True)
                    elif data.get('status') == 'started':
                        print(f"\n[STARTED] {data.get('message')}\n")
                    elif data.get('status') == 'complete':
                        print("\n\n[COMPLETE] Done.")
                        print("SOURCES:", json.dumps(data.get('sources'), indent=2))
                    elif data.get('status') == 'error':
                        print(f"\n\n[ERROR from server] {data.get('message')}")
                except json.JSONDecodeError:
                    print(f"\n[RAW] {decoded_line}")
except requests.exceptions.ConnectionError:
    print("[FAIL] Could not connect to Flask server at port 5001. Is it running?")
except requests.exceptions.Timeout:
    print("[TIMEOUT] Server did not respond within 10 seconds.")
except Exception as e:
    print(f"[EXCEPTION] {e}")
