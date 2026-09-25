import urllib.request

images = [
    # Navreh / Spring
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Almond_Blossom_in_Kashmir.jpg/640px-Almond_Blossom_in_Kashmir.jpg", "navreh.jpg"),
    # Hearath / Shiva
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Shiva_Lingam_at_Kashi_Vishwanath_Temple.jpg/640px-Shiva_Lingam_at_Kashi_Vishwanath_Temple.jpg", "hearath.jpg"),
    # Zetha Ashtami / Kheer Bhawani
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Kheer_Bhawani_Temple_in_Ganderbal%2C_Kashmir.jpg/640px-Kheer_Bhawani_Temple_in_Ganderbal%2C_Kashmir.jpg", "zetha_ashtami.jpg"),
    # Jaramsatam / Krishna
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Krishna_flute.jpg/640px-Krishna_flute.jpg", "jaramsatam.jpg"),
    # Pann / Roth / Bread
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Indian_breads.jpg/640px-Indian_breads.jpg", "pann.jpg"),
    # Gaad Bath / Fish
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Fish_Curry_-_Kerala_Style.jpg/640px-Fish_Curry_-_Kerala_Style.jpg", "gaad_bath.jpg")
]

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')]
urllib.request.install_opener(opener)

for url, filename in images:
    try:
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(url, f"public/festivals/{filename}")
    except Exception as e:
        print(f"Failed {filename}: {e}")

