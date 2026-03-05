import cv2
import numpy as np
import sys

def normalize_image(input_path, output_path, target_size=640, target_fill=0.96):
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None or img.shape[2] != 4:
        print(f"Skipping {input_path} (not a valid PNG with alpha)")
        return
    
    alpha = img[:, :, 3]
    coords = cv2.findNonZero(alpha)
    if coords is None:
        print(f"Image {input_path} is completely empty.")
        return
        
    x, y, w, h = cv2.boundingRect(coords)
    cropped = img[y:y+h, x:x+w]
    
    # Calculate scale factor to make the max dimension equal to target_fill * target_size
    desired_dim = int(target_size * target_fill)
    scale = desired_dim / max(w, h)
    
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    # Paste onto a blank 640x640 canvas
    canvas = np.zeros((target_size, target_size, 4), dtype=np.uint8)
    
    # Calculate top-left coordinates to center the image
    start_x = (target_size - new_w) // 2
    # Standardize bottom margin instead of vertical center (looks better for characters sitting on the floor)
    # Let's see: if we center vertically
    start_y = (target_size - new_h) // 2
    
    canvas[start_y:start_y+new_h, start_x:start_x+new_w] = resized
    cv2.imwrite(output_path, canvas)
    print(f"Normalized {output_path}: canvas={target_size}x{target_size}, object={new_w}x{new_h}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        normalize_image(p, p)
