import os
import sys

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("Please install rembg and Pillow: pip install rembg Pillow")
    exit(1)

if len(sys.argv) != 3:
    print("Usage: python make_transparent_single.py <input_path> <output_path>")
    exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

print(f"Removing background for {input_path}...")
try:
    input_image = Image.open(input_path).convert("RGBA")
    transparent_image = remove(input_image)
    transparent_image.save(output_path)
    print(f"Successfully saved transparent image to {output_path}")
except Exception as e:
    print(f"Error: {e}")
