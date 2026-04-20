import requests
import json
import sys
import io

# Force UTF-8 output so the Windows terminal doesn't choke on unicode from the LLM
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

url = "http://127.0.0.1:5001/api/faculty/query"
# Using C4103 based on the context from your last log
payload = {
    "query": "Give me an overview of the most critical concepts in Chapter 1.",
    "subject_codes": ["C4103"]
}

print(f"Testing Faculty RAG Endpoint: {url}")
print(f"Payload: {payload}\n")

try:
    response = requests.post(url, json=payload, stream=True)
    
    if response.status_code != 200:
        print(f"Server returned Error {response.status_code}: {response.text}")
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
                        print("\n\n[COMPLETE] Successfully compiled notes.")
                        print("SOURCES:", json.dumps(data.get('sources'), indent=2))
                    elif data.get('status') == 'error':
                        print(f"\n\n[ERROR] {data.get('message')}")
                except json.JSONDecodeError:
                    print(f"\n[RAW CHUNK] {decoded_line}")
except Exception as e:
    print(f"Connection Error: {e}")
