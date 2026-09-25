import urllib.request
import json
import os

images = {
    "gaad_bath.jpg": "File:Fish_curry_Kerala.jpg",
    "hearath.jpg": "File:A_Lingam_at_Kashi_Vishwanath_temple.jpg",
    "navreh.jpg": "File:Almond_blossoms.jpg",
    "zetha_ashtami.jpg": "File:Kheer_Bhawani_Temple.jpg",
    "jaramsatam.jpg": "File:Krishna_Govind.jpg",
    "pann.jpg": "File:Roti_bread.jpg"
}

def download_wiki(filename, title):
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=imageinfo&iiprop=url&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read().decode('utf-8'))
            pages = data['query']['pages']
            img_url = list(pages.values())[0]['imageinfo'][0]['url']
            print(f"Downloading {title} from {img_url}")
            urllib.request.urlretrieve(img_url, f"public/festivals/{filename}")
            return True
    except Exception as e:
        print(title, e)
        return False

# fallback titles
fallback = [
    "File:Fish.jpg",
    "File:Shiva.jpg",
    "File:Almond.jpg",
    "File:Temple.jpg",
    "File:Krishna.jpg",
    "File:Bread.jpg"
]

os.makedirs("public/festivals", exist_ok=True)
for (file, title), fb in zip(images.items(), fallback):
    if not download_wiki(file, title):
        download_wiki(file, fb)

