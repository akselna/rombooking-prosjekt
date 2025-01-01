import os
from PIL import Image

# Sti til mappen der bildene er lagret
IMAGE_DIR = "../media/rooms"

def compress_image(image_path, output_path, quality=30):
    try:
        original_size = os.path.getsize(image_path)
        print(f"Behandler {image_path}: Opprinnelig størrelse {original_size / 1024:.2f} KB")
        
        with Image.open(image_path) as img:
            img = img.convert("RGB")
            img.save(output_path, "JPEG", optimize=True, quality=quality)
        
        compressed_size = os.path.getsize(output_path)
        print(f"Komprimert {image_path}: Ny størrelse {compressed_size / 1024:.2f} KB")
    except Exception as e:
        print(f"Feil ved komprimering av {image_path}: {e}")


def compress_all_images():
    for root, dirs, files in os.walk(IMAGE_DIR):
        for file in files:
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                full_path = os.path.join(root, file)
                compress_image(full_path, full_path)  # Overskriver originalen

if __name__ == "__main__":
    compress_all_images()
