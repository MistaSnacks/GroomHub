import cv2
import sys
from manual_scale import scale_and_crop

# Rain mud was normalized to 640x640 height fill 0.96.
# 1.15x scale with y_anchor="bottom" to preserve feet.
scale_and_crop("public/maui-assets/maui-rain-mud-blog.png", "public/maui-assets/maui-rain-mud-blog.png", 1.15, y_anchor='bottom')

