import os
from PIL import Image

# 定义图片目录和输出目录
input_dir = "D:\\Projects\\DevSpace\\web-sandbox/static/assets/blocks/lower"
output_dir = "D:\\Projects\\DevSpace\\web-sandbox/static/assets/blocks/lower_resized"
os.makedirs(output_dir, exist_ok=True)

def resize_image(image_path, output_path, size=(16, 16)):
    """将图片调整为指定大小并保存"""
    with Image.open(image_path) as img:
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(output_path, "PNG")

# 遍历目录中的所有图片
for filename in os.listdir(input_dir):
    if filename.endswith(".png"):
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)
        resize_image(input_path, output_path)
        print(f"Resized {filename}")

print("所有图片已调整大小！")
