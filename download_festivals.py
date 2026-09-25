import urllib.request
import json
import os

def get_image(filename, save_as):
    api_url = f"https://en.wikipedia.org/w/api.php?action=query&titles=File:{filename}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read().decode('utf-8'))
            pages = data['query']['pages']
            url = list(pages.values())[0]['imageinfo'][0]['url']
            print(f"Downloading {filename} from {url}")
            urllib.request.urlretrieve(url, f"public/festivals/{save_as}")
    except Exception as e:
        print(f"Failed {filename}: {e}")

images = [
    ("Kheer_Bhawani_Temple_in_Ganderbal,_Kashmir.jpg", "zetha_ashtami.jpg"),
    ("Almond_blossoms.jpg", "navreh.jpg"),
    ("Shiva_Lingam_-_Kashi_Vishwanath_Temple_-_Varanasi.jpg", "hearath.jpg"),
    ("Krishna_with_flute.jpg", "jaramsatam.jpg"),
]

for img in images:
    get_image(img[0], img[1])

