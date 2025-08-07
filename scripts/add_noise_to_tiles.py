import os
import random
from PIL import Image, ImageDraw
from opensimplex import OpenSimplex

# 定义图片目录和输出目录
input_dir = "D:\\Projects\\DevSpace\\web-sandbox/static/assets/blocks/lower"
output_dir = "D:\\Projects\\DevSpace\\web-sandbox/static/assets/blocks/lower_noisy"
os.makedirs(output_dir, exist_ok=True)

def add_textured_noise_to_image(image_path, output_path):
    """为图片添加基于原色的纹理噪点并保存"""
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        width, height = img.size

        # 创建一个新的图层用于噪点
        noise_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(noise_layer)

        # 初始化 OpenSimplex 噪声生成器
        simplex = OpenSimplex(seed=random.randint(0, 100))
        scale = 200.0  # 控制噪声的纹理大小

        for y in range(height):
            for x in range(width):
                # 获取原图像素颜色
                r, g, b, a = img.getpixel((x, y))

                # 基于 OpenSimplex 噪声调整颜色
                noise = simplex.noise2(x / scale, y / scale)
                noise = (noise + 1) / 2  # 将噪声值归一化到 [0, 1]
                noise_intensity = int(noise * 10)  # 噪声强度范围

                # 生成新的颜色值
                new_r = min(255, max(0, r + random.randint(-noise_intensity, noise_intensity)))
                new_g = min(255, max(0, g + random.randint(-noise_intensity, noise_intensity)))
                new_b = min(255, max(0, b + random.randint(-noise_intensity, noise_intensity)))

                # 绘制噪点
                draw.point((x, y), fill=(new_r, new_g, new_b, a))

        # 将噪点图层叠加到原图
        img = Image.alpha_composite(img, noise_layer)
        img.save(output_path, "PNG")

# 遍历目录中的所有图片
for filename in os.listdir(input_dir):
    if filename.endswith(".png"):
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)
        add_textured_noise_to_image(input_path, output_path)
        print(f"Processed {filename}")

print("所有图片处理完成！")
