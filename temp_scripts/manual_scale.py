import cv2
import numpy as np
import sys

def scale_and_crop(input_path, output_path, scale_factor, y_anchor='bottom'):
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None or img.shape[2] != 4:
        print(f"Skipping {input_path}")
        return
        
    h, w = img.shape[:2]
    
    # Calculate new size
    new_w = int(w * scale_factor)
    new_h = int(h * scale_factor)
    
    # Resize the image
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
    
    # Calculate cropping coordinates to get back to original size (centered horizontally)
    start_x = (new_w - w) // 2
    
    if y_anchor == 'bottom':
        # Crop from the bottom of the scaled image 
        # (This keeps the feet on the "ground" where they were)
        # We want the bottom of the crop to align with the bottom of the original non-transparent content ideally.
        # Simple approach: anchor to the bottom of the canvas
        start_y = new_h - h
    elif y_anchor == 'center':
        start_y = (new_h - h) // 2
    else:
        # custom: 80% towards bottom
        start_y = int((new_h - h) * 0.8)
        
    # Ensure bounds are valid
    start_x = max(0, min(start_x, new_w - w))
    start_y = max(0, min(start_y, new_h - h))
    
    # Crop to original size
    cropped = resized[start_y:start_y+h, start_x:start_x+w]
    
    cv2.imwrite(output_path, cropped)
    print(f"Scaled {input_path} by {scale_factor}x and saved to {output_path}. y-offset={start_y}")

if __name__ == "__main__":
    # 1. Rain mud is 640x640: Scale by 1.5x
    scale_and_crop("public/maui-assets/maui-rain-mud-blog.png", "public/maui-assets/maui-rain-mud-blog.png", 1.5, y_anchor='custom')
    
    # 2. Winter is currently 1024x1024 because the original was restored.
    # Wait, the winter original was 1024x1024. If we scale by 1.25x and crop to 1024x1024,
    # and then the browser scales the 1024x1024 down to fit the container... 
    # The browser subagent analysis was based on the EXACT output of my normalize_size script!
    # Because my normalize_size script saved both as 640x640 with height fill 0.96.
    # So I should re-normalize them FIRST, and then scale those normalized images by 1.5x and 1.25x!
    pass
