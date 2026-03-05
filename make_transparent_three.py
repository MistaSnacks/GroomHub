import os

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("Please install rembg and Pillow: pip install rembg Pillow")
    exit(1)

jobs = [
    ('/Users/admin/.gemini/antigravity/brain/533ed358-d0b4-4c1a-b974-2ebd41266a5a/calendar_maui_no_fade_fixed_1772658830309.png', 'public/maui-assets/maui-grooming-frequency-blog.png'),
    ('/Users/admin/.gemini/antigravity/brain/533ed358-d0b4-4c1a-b974-2ebd41266a5a/winter_maui_sitting_blue_pompom_1772658817934.png', 'public/maui-assets/maui-winter-grooming-blog.png')
]

for input_path, output_path in jobs:
    print(f"Removing background for {input_path}...")
    try:
        input_image = Image.open(input_path).convert("RGBA")
        transparent_image = remove(input_image)
        transparent_image.save(output_path)
        print(f"Successfully saved transparent image to {output_path}")
    except Exception as e:
        print(f"Error: {e}")
