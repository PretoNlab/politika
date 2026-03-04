import sys
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

input_path = '/Users/diegomachado/.gemini/antigravity/brain/0dc0711a-1212-4b95-b7a0-f25dab4f8dec/media__1771986254782.png'
img = Image.open(input_path).convert("RGBA")
w, h = img.size

# Favicon: Square from the left edge. The icon is on the left.
# It seems from the HTML preview that the icon fits well in a left-anchored square the size of the height.
favicon_size = h
favicon = img.crop((0, 0, favicon_size, favicon_size))

# Remove the old SVG if it exists so we just use PNG/ICO
import os
if os.path.exists('/Users/diegomachado/politika/public/favicon.svg'):
    os.remove('/Users/diegomachado/politika/public/favicon.svg')

favicon.save('/Users/diegomachado/politika/public/favicon.png', format='PNG')
# ICO format allows multiple sizes, but passing one works for basic support
favicon_resized = favicon.resize((64, 64), Image.Resampling.LANCZOS)
favicon_resized.save('/Users/diegomachado/politika/public/favicon.ico', format='ICO', sizes=[(64, 64)])

# OG Image: 1200x630
# Background: Apple style off-white (same as surface)
og = Image.new('RGBA', (1200, 630), (248, 249, 251, 255)) # #f8f9fb

# Resize original image to fit reasonably (e.g. max width 600)
target_w = 700
ratio = target_w / w
target_h = int(h * ratio)
img_resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Paste centered
offset_x = (1200 - target_w) // 2
offset_y = (630 - target_h) // 2

og.paste(img_resized, (offset_x, offset_y), img_resized)

og.convert('RGB').save('/Users/diegomachado/politika/public/og-image.png', format='PNG')

print("Assets created: favicon.png, favicon.ico, og-image.png")
