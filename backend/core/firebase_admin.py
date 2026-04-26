import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json

if not firebase_admin._apps:
    key_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase_admin_key.json")

    if os.path.exists(key_path):
        cred = credentials.Certificate(key_path)
    else:
        # On Render: load from FIREBASE_CREDENTIALS env var (JSON string)
        raw = os.environ.get("FIREBASE_CREDENTIALS")
        if not raw:
            raise RuntimeError("Firebase credentials not found. Set FIREBASE_CREDENTIALS env var.")
        cred = credentials.Certificate(json.loads(raw))

    firebase_admin.initialize_app(cred)

db = firestore.client()
fa = auth
