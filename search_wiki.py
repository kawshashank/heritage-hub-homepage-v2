import urllib.request
import json

def search(q):
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={q}&srnamespace=6&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read().decode('utf-8'))
        return [res['title'] for res in data['query']['search'][:3]]

print("Fish:", search("fish curry"))
print("Shiva:", search("shiva lingam"))
print("Kheer Bhawani:", search("kheer bhawani"))
print("Krishna:", search("krishna flute"))
print("Bread:", search("sweet bread rot"))
