import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Initialize Firebase Admin SDK (only once)
if not firebase_admin._apps:
    key_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase_admin_key.json")
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)

# Export Firestore client and Auth
db = firestore.client()
fa = auth   # Firebase Admin Auth — used to verify tokens
