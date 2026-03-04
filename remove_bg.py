import glob
import os

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("Please install rembg and Pillow: pip install rembg Pillow")
    exit(1)

input_patterns = [
    'public/maui-assets/maui-choosing-groomer-blog.png',
    'public/maui-assets/maui-grooming-frequency-blog.png',
    'public/maui-assets/maui-pnw-seasonal-blog.png',
    'public/maui-assets/maui-rain-mud-blog.png',
    'public/maui-assets/maui-winter-grooming-blog.png',
    'public/blog-assets/grooming-cost-blog.png'
]

print("Starting background removal process...")
for pattern in input_patterns:
    for input_path in glob.glob(pattern):
        print(f"Processing {input_path}...")
        try:
            input_image = Image.open(input_path)
            output_image = remove(input_image)
            output_image.save(input_path)
            print(f"Successfully removed background from {input_path}")
        except Exception as e:
            print(f"Error processing {input_path}: {e}")
print("Done!")
