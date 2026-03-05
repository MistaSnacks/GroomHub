import cv2
import numpy as np
import glob

def get_bbox(img_path):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None or img.shape[2] != 4:
        return None
    alpha = img[:, :, 3]
    coords = cv2.findNonZero(alpha)
    if coords is None:
        return None
    x, y, w, h = cv2.boundingRect(coords)
    return {
        "file": img_path.split("/")[-1],
        "image_size": img.shape[:2],
        "bbox": (x, y, w, h),
        "fill_ratio_h": h / img.shape[0],
        "fill_ratio_w": w / img.shape[1]
    }

for f in glob.glob("public/maui-assets/maui-*-blog.png"):
    res = get_bbox(f)
    if res:
        print(f"{res['file']}: size={res['image_size']}, bounding_box={res['bbox']}, "
              f"height_fill={res['fill_ratio_h']:.2f}, width_fill={res['fill_ratio_w']:.2f}")
