#!/usr/bin/env python3
"""
Converte WebP animado para MP4 usando Pillow + imageio/ffmpeg.
Uso: python3 scripts/webp_to_mp4.py <input.webp> <output.mp4>
"""

import sys
import os
import subprocess
import tempfile
from PIL import Image

def webp_to_mp4(input_path: str, output_path: str, fps: int = 20):
    img = Image.open(input_path)
    frames_dir = tempfile.mkdtemp()
    frame_count = 0

    try:
        while True:
            frame = img.copy().convert("RGB")
            frame_path = os.path.join(frames_dir, f"frame_{frame_count:06d}.png")
            frame.save(frame_path, "PNG")
            frame_count += 1
            img.seek(img.tell() + 1)
    except EOFError:
        pass

    if frame_count == 0:
        print("Nenhum frame encontrado no WebP.")
        sys.exit(1)

    print(f"✓ {frame_count} frames extraídos. Convertendo para MP4...")

    # Tentar ffmpeg nativo primeiro, depois imageio
    ffmpeg_candidates = [
        "ffmpeg",
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        os.path.expanduser("~/Library/Python/3.9/bin/ffmpeg"),
    ]

    ffmpeg_bin = None
    for candidate in ffmpeg_candidates:
        if os.path.isfile(candidate) or subprocess.run(
            ["which", candidate], capture_output=True
        ).returncode == 0:
            ffmpeg_bin = candidate
            break

    if ffmpeg_bin:
        cmd = [
            ffmpeg_bin, "-y",
            "-framerate", str(fps),
            "-i", os.path.join(frames_dir, "frame_%06d.png"),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-crf", "23",
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ MP4 gerado: {output_path}")
        else:
            print("Erro ffmpeg:", result.stderr[-500:])
            sys.exit(1)
    else:
        # Fallback: imageio
        try:
            import imageio
            writer = imageio.get_writer(output_path, fps=fps, codec="libx264", quality=8)
            for i in range(frame_count):
                frame_path = os.path.join(frames_dir, f"frame_{i:06d}.png")
                writer.append_data(imageio.imread(frame_path))
            writer.close()
            print(f"✓ MP4 gerado via imageio: {output_path}")
        except Exception as e:
            print(f"Erro imageio: {e}")
            sys.exit(1)

    # Cleanup
    import shutil
    shutil.rmtree(frames_dir, ignore_errors=True)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python3 webp_to_mp4.py <input.webp> <output.mp4>")
        sys.exit(1)
    webp_to_mp4(sys.argv[1], sys.argv[2])
