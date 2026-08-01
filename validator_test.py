import os

# 1. Define our allowed rule (Only PDFs)
ALLOWED_EXTENSIONS = {'pdf'}

# 2. Define the Drop Zone folder we just created
UPLOAD_FOLDER = 'uploads'

# 3. Create the Gatekeeper Function
def allowed_file(filename):
    # This checks two things:
    # A. Does the filename actually have a dot in it? ('.' in filename)
    # B. If we split the word at the dot, is the right side 'pdf'?
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 4. Test the Logic Manually
def test_upload_mechanism():
    print("--- IMED AI Gatekeeper Test ---")
    
    # We ask the user to pretend they are uploading a file
    test_filename = input("Type a fake filename to upload (e.g., resume.pdf or photo.jpg): ")
    
    # We pass their input to our Gatekeeper
    if allowed_file(test_filename):
        print(f"✅ SUCCESS: '{test_filename}' is a valid PDF. We can move it to the '{UPLOAD_FOLDER}' folder.")
    else:
        print(f"❌ REJECTED: '{test_filename}' is not a PDF. System blocked the upload.")

# Run the test
if __name__ == "__main__":
    test_upload_mechanism()