import os

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("Please install rembg and Pillow: pip install rembg Pillow")
    exit(1)

input_path = '/Users/admin/.gemini/antigravity/brain/533ed358-d0b4-4c1a-b974-2ebd41266a5a/winter_maui_blue_pompom_1772658595650.png'
output_path = 'public/maui-assets/maui-winter-grooming-blog.png'

print(f"Removing background for {input_path}...")
try:
    input_image = Image.open(input_path).convert("RGBA")
    transparent_image = remove(input_image)
    transparent_image.save(output_path)
    print(f"Successfully saved transparent image to {output_path}")
except Exception as e:
    print(f"Error: {e}")
