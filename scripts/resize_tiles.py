import os
from PIL import Image

# 定义图片目录和输出目录
input_dir = "D:\\Projects\\DevSpace\\web-sandbox/static/assets/blocks/lower"
output_dir = "D:\\Projects\\DevSpace\\web-sandbox/static/assets/blocks/lower_resized"
os.makedirs(output_dir, exist_ok=True)

def resize_image(image_path, output_path, size=(64, 64)):
    """将图片调整为指定大小并保存（像素风：最近邻，无平滑）"""
    with Image.open(image_path) as img:
        # 使用最近邻插值，确保像素边缘不被平滑
        try:
            resample = Image.Resampling.NEAREST  # Pillow >= 9
        except AttributeError:
            resample = Image.NEAREST  # 兼容旧版本 Pillow
        img = img.resize(size, resample)
        img.save(output_path, "PNG")

# 遍历目录中的所有图片
for filename in os.listdir(input_dir):
    if filename.endswith(".png"):
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)
        resize_image(input_path, output_path)
        print(f"Resized {filename}")

print("所有图片已调整大小！")
