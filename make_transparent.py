import glob
import os

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("Please install rembg and Pillow: pip install rembg Pillow")
    exit(1)

input_patterns = [
    'public/maui-assets/*blog.png',
    'public/blog-assets/*blog.png',
    'public/maui-characters/*costume.png'
]

print("Starting background removal process...")
for pattern in input_patterns:
    for input_path in glob.glob(pattern):
        print(f"Processing {input_path}...")
        try:
            # First, check if the image has a fake background and remove it using rembg
            input_image = Image.open(input_path).convert("RGBA")
            
            # Remove the background to get a clean transparent image
            print("  Removing background...")
            transparent_image = remove(input_image)
            
            # Save the image as transparent PNG
            transparent_image.save(input_path)
            print(f"Successfully made background transparent for {input_path}")
        except Exception as e:
            print(f"Error processing {input_path}: {e}")
print("Done!")
