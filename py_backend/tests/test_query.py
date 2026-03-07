import urllib.request, json, urllib.error
req = urllib.request.Request(
    'http://localhost:5001/api/query', 
    data=json.dumps({'query': 'What is organizational behaviour?', 'year': 4, 'branch': 'CSDS', 'student_name': 'Zaheer'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)
try:
    r = urllib.request.urlopen(req)
    print("SUCCESS")
    print(r.read().decode())
except urllib.error.HTTPError as e:
    print("ERROR")
    print(e.read().decode())
