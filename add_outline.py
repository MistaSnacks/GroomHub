import sys
import cv2
import numpy as np

def add_outline(input_path, output_path, outline_thickness=4, outline_color=(45, 30, 25)):
    # Read the image with alpha channel
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None or img.shape[2] != 4:
        print("Image not found or does not have an alpha channel")
        sys.exit(1)
        
    b, g, r, a = cv2.split(img)
    
    # Threshold the alpha channel to get a binary mask of the subject
    _, mask = cv2.threshold(a, 10, 255, cv2.THRESH_BINARY)
    
    # Create a morphological kernel for dilation
    kernel = np.ones((outline_thickness, outline_thickness), np.uint8)
    
    # Dilate the mask to get the enlarged subject area
    dilated_mask = cv2.dilate(mask, kernel, iterations=1)
    
    # The outline is the difference between dilated mask and original mask
    # Actually we can just apply the outline color where dilated_mask is 255
    # and original mask is 0 (or blend carefully)
    outline_mask = cv2.subtract(dilated_mask, mask)
    
    # Create the outline image with the specified color
    # OpenCV uses BGR, so reverse the RGB tuple
    outline_bgr = np.zeros((img.shape[0], img.shape[1], 3), dtype=np.uint8)
    outline_bgr[:] = (outline_color[2], outline_color[1], outline_color[0])
    
    # Where original mask is 0 but dilated is 255, we put the outline color
    # For a smoother look we could use blur, but simple replacement is fine
    
    # Create the new image
    new_img = np.zeros_like(img)
    
    # Copy original color channels
    new_b = np.where(outline_mask > 0, outline_color[2], b)
    new_g = np.where(outline_mask > 0, outline_color[1], g)
    new_r = np.where(outline_mask > 0, outline_color[0], r)
    new_a = np.where(outline_mask > 0, 255, a)
    
    new_img = cv2.merge([new_b, new_g, new_r, new_a])
    
    cv2.imwrite(output_path, new_img)
    print(f"Saved outlined image to {output_path}")

if len(sys.argv) < 3:
    print("Usage: python3 add_outline.py input output [thickness]")
    sys.exit(1)

thickness = 4
if len(sys.argv) > 3:
    thickness = int(sys.argv[3])

color = (55, 35, 35) # A dark brownish-black outline typical of the artwork
add_outline(sys.argv[1], sys.argv[2], thickness, color)
