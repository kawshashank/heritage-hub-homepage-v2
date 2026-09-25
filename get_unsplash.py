import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# We can search the pixabay API or wikimedia API correctly.
# Let's query wikimedia api for the actual original image urls.

def get_wiki_img(title):
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=imageinfo&iiprop=url&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8'))
            pages = data['query']['pages']
            return list(pages.values())[0]['imageinfo'][0]['url']
    except Exception as e:
        print(e)
        return None

titles = {
    "navreh": "File:Almond_blossoms.jpg",
    "hearath": "File:A_Lingam_at_Kashi_Vishwanath_temple.jpg",
    "zetha_ashtami": "File:Kheer_Bhawani_Temple_in_Ganderbal,_Kashmir.jpg",
    "jaramsatam": "File:Krishna_flute.jpg",
    "pann": "File:Indian_breads.jpg",
    "gaad_bath": "File:Fish_Curry_-_Kerala_Style.jpg"
}

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')]
urllib.request.install_opener(opener)

for k, v in titles.items():
    u = get_wiki_img(v)
    if u:
        print(f"Downloading {k}.jpg from {u}")
        try:
            urllib.request.urlretrieve(u, f"public/festivals/{k}.jpg")
        except Exception as e:
            print("Failed download:", e)
