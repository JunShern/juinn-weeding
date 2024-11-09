from PIL import Image
import os

# Define your input and output folder paths
input_folder = "ori_images"
output_folder = "small_images"

# Create output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Define the target size for the mosaic pieces
target_size = 80  # Size of final square image

# Process each image in the input folder
for filename in os.listdir(input_folder):
    if filename.lower().endswith(".jpg"):
        # Open the image
        img_path = os.path.join(input_folder, filename)
        with Image.open(img_path) as img:
            # Calculate proportional resize dimensions
            width, height = img.size
            if width > height:
                new_height = target_size
                new_width = int(width * target_size / height)
            else:
                new_width = target_size
                new_height = int(height * target_size / width)
            
            # Resize image proportionally
            img = img.resize((new_width, new_height), Image.LANCZOS)
            
            # Crop to square from center
            width, height = img.size
            left = (width - target_size) // 2
            top = (height - target_size) // 2
            right = left + target_size
            bottom = top + target_size
            img = img.crop((left, top, right, bottom))

            # Save the resized and cropped image
            output_path = os.path.join(output_folder, filename)
            img.save(output_path)
