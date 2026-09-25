import requests
urls = [
    "https://images.unsplash.com/photo-1544458997-717621c00216?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496060169243-453fde45943b?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1574786198871-33104f794e66?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605369651581-22fb6e987f63?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=500&auto=format&fit=crop"
]
for u in urls:
    r = requests.head(u)
    print(f"{r.status_code} - {u}")
