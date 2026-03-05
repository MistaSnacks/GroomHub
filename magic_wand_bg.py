import cv2
import numpy as np
import sys

def precise_remove_bg(input_path, output_path):
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Error loading {input_path}")
        return

    # Extract BGR and Alpha
    if img.shape[2] == 4:
        bgr = img[:, :, :3]
        alpha = img[:, :, 3]
    else:
        bgr = img
        alpha = np.ones((img.shape[0], img.shape[1]), dtype=np.uint8) * 255
    
    h, w = bgr.shape[:2]
    mask = np.zeros((h+2, w+2), np.uint8)
    
    # We will do a 2-step process. 
    # FIRST, flood fill the true cream background from the very corners.
    # The image is highly distinct so tolerance can be tight.
    tol = 3
    diff = (tol, tol, tol)
    flags = cv2.FLOODFILL_MASK_ONLY | (1 << 8) | 4
    
    # Fill from the 4 corners to catch the cream BG
    cv2.floodFill(bgr, mask, (0,0), (0,255,0), diff, diff, flags)
    cv2.floodFill(bgr, mask, (w-1,0), (0,255,0), diff, diff, flags)
    cv2.floodFill(bgr, mask, (0,h-1), (0,255,0), diff, diff, flags)
    cv2.floodFill(bgr, mask, (w-1,h-1), (0,255,0), diff, diff, flags)
    
    cream_mask = mask[1:h+1, 1:w+1].copy()

    # SECOND, find the white outline. The white outline is pure white (255,255,255)
    # create a mask of pure white pixels
    white_pixels = cv2.inRange(bgr, np.array([245, 245, 245]), np.array([255, 255, 255]))
    
    # We only want to remove white pixels that touch the cream mask 
    # (i.e., the exterior border), NOT the white pixels inside the dog.
    # We can do this by dilating the cream background mask
    kernel = np.ones((10,10), np.uint8)
    dilated_cream = cv2.dilate(cream_mask, kernel, iterations=2)
    
    # Exterior white pixels are white pixels that fall inside the dilated cream area
    exterior_white = cv2.bitwise_and(white_pixels, white_pixels, mask=dilated_cream)

    # Finally combine the cream mask and the exterior white mask
    # If a pixel is in the cream_mask OR in the exterior_white mask, make it transparent
    
    new_img = np.zeros((h, w, 4), dtype=np.uint8)
    new_img[:, :, :3] = bgr
    
    # Start with full opacity
    new_img[:, :, 3] = alpha
    
    # Remove cream
    new_img[:, :, 3] = np.where(cream_mask == 1, 0, new_img[:, :, 3])
    
    # Remove exterior white
    new_img[:, :, 3] = np.where(exterior_white > 0, 0, new_img[:, :, 3])

    cv2.imwrite(output_path, new_img)
    print(f"Successfully processed {input_path} -> {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 precise_bg.py <input> <output>")
        sys.exit(1)
    
    precise_remove_bg(sys.argv[1], sys.argv[2])
