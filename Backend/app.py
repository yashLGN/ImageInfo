from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import os
import uuid
import numpy as np
from PIL import Image
from io import BytesIO
import base64
from flask import send_from_directory

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
PROCESSED_FOLDER = "processed"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend is running"})

@app.route("/upload", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # File-name
    filename = f"{uuid.uuid4()}.png"

    input_path = os.path.join(UPLOAD_FOLDER, filename)
    output_path = os.path.join(PROCESSED_FOLDER, filename)

    # Save uploaded image
    file.save(input_path)

    # Read image using OpenCV
    image = cv2.imread(input_path)

    # Check if image was loaded successfully
    if image is None:
        return jsonify({"error": "Failed to load image"}), 400

    # Convert to grayscale using opencv
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Edge detection using Canny
    edges = cv2.Canny(gray, 100, 200)

    # Sobel X and Y
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

    # Convert Sobel results to uint8
    abs_sobelx = np.uint8(np.absolute(sobelx))
    abs_sobely = np.uint8(np.absolute(sobely))

    # Histogram of grayscale image
    histogram = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten().tolist()

    # Function to convert numpy image to base64 PNG
    def to_base64_png(img_array):
        pil_img = Image.fromarray(img_array)
        buffered = BytesIO()
        pil_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return img_str

    bw_image_b64 = to_base64_png(gray)
    edges_b64 = to_base64_png(edges)
    sobelx_b64 = to_base64_png(abs_sobelx)
    sobely_b64 = to_base64_png(abs_sobely)

    return jsonify({
        "bw_image": bw_image_b64,
        "edges": edges_b64,
        "sobelx": sobelx_b64,
        "sobely": sobely_b64,
        "histogram": histogram
    })


UPLOAD_FOLDER = "uploads"
PROCESSED_FOLDER = "processed"

@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/processed/<filename>")
def serve_processed(filename):
    return send_from_directory(PROCESSED_FOLDER, filename)

@app.route("/history_list", methods=["GET"])
def history_list():
    uploaded_files = sorted(os.listdir(UPLOAD_FOLDER))
    processed_files = sorted(os.listdir(PROCESSED_FOLDER))
    return jsonify({
        "uploads": uploaded_files,
        "processed_bw": processed_files
    })


if __name__ == "__main__":
    try:
        app.run(debug=True)
    except Exception as e:
        print(f"Error starting the Flask app: {e}")