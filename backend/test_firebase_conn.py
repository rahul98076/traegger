import firebase_admin
from firebase_admin import credentials, firestore
import os

def test_firestore():
    service_account_path = "traegger-c0901-firebase-adminsdk-fbsvc-e92b5c9c29.json"
    project_id = "traegger-c0901"
    
    if not os.path.exists(service_account_path):
        print(f"Error: Service account file {service_account_path} not found.")
        return

    print(f"Attempting to initialize Firebase for project {project_id}...")
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred, {'projectId': project_id})
        
        db = firestore.client()
        print("Successfully connected to Firestore.")
        
        # Test write
        print("Testing write operation...")
        test_doc = db.collection('test_connection').document('connectivity_check')
        test_doc.set({
            'status': 'success',
            'timestamp': firestore.SERVER_TIMESTAMP,
            'message': 'Connectivity test from backend'
        })
        print("Write successful!")
        
        # Test read
        print("Testing read operation...")
        doc = test_doc.get()
        if doc.exists:
            print(f"Read successful! Document data: {doc.to_dict()}")
        else:
            print("Read failed: Document does not exist.")
            
    except Exception as e:
        print(f"Failure: {str(e)}")

if __name__ == "__main__":
    test_firestore()
