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
    'public/blog-assets/*blog.png'
]

cream_bg_color = (253, 248, 240, 255) # #FDF8F0 with alpha

print("Starting background replacement process...")
for pattern in input_patterns:
    for input_path in glob.glob(pattern):
        print(f"Processing {input_path}...")
        try:
            # First, check if the image has a fake background and remove it using rembg
            input_image = Image.open(input_path).convert("RGBA")
            
            # Remove the background to get a clean transparent image
            print("  Removing background...")
            transparent_image = remove(input_image)
            
            # Create a solid cream background
            bg_image = Image.new("RGBA", transparent_image.size, cream_bg_color)
            
            # Composite the transparent image onto the cream background
            print("  Compositing over cream background...")
            final_image = Image.alpha_composite(bg_image, transparent_image)
            
            # Convert back to RGB for saving without alpha
            final_image = final_image.convert("RGB")
            
            # Save the image
            final_image.save(input_path)
            print(f"Successfully added cream background to {input_path}")
        except Exception as e:
            print(f"Error processing {input_path}: {e}")
print("Done!")
