#!/usr/bin/env python3
"""
Generate favicon and icon files from the logo-kabyle.png source image.
Creates: favicon.ico, favicon-32x32.png, apple-icon.png, icon.png
"""
from PIL import Image
import os

# Paths
SOURCE = "/home/z/my-project/public/logo-kabyle.png"
OUTPUT_DIR = "/home/z/my-project/public"

# Open source image
img = Image.open(SOURCE)
print(f"Source image: {img.size} {img.mode}")

# Convert to RGBA for proper alpha handling
if img.mode != "RGBA":
    img = img.convert("RGBA")

# Generate different sizes
sizes = {
    "favicon-32x32.png": (32, 32),
    "apple-icon.png": (180, 180),
    "icon.png": (512, 512),
}

for filename, (w, h) in sizes.items():
    resized = img.resize((w, h), Image.LANCZOS)
    output_path = os.path.join(OUTPUT_DIR, filename)
    resized.save(output_path, "PNG")
    print(f"Created {filename}: {w}x{h}")

# Create favicon.ico (multi-size ICO with 16x16, 32x32, 48x48)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = [img.resize((w, h), Image.LANCZOS) for w, h in ico_sizes]

favicon_path = os.path.join(OUTPUT_DIR, "favicon.ico")
ico_images[0].save(
    favicon_path,
    format="ICO",
    sizes=[(img.width, img.height) for img in ico_images],
    append_images=ico_images[1:],
)
print(f"Created favicon.ico with sizes: {[f'{w}x{h}' for w, h in ico_sizes]}")

print("\nAll favicon/icon files generated successfully!")
