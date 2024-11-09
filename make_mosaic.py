from PIL import Image
import os
import numpy as np
from collections import defaultdict
from tqdm import tqdm

def get_average_color(img):
    """Returns the average RGB color of an image"""
    return tuple(np.array(img).mean(axis=(0, 1)).astype(int))

def color_distance(c1, c2):
    """Calculate Euclidean distance between two RGB colors"""
    # Ignore alpha channel if it exists
    c1 = c1[:3]
    c2 = c2[:3]
    return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5

def split_image_into_tiles(img, tile_size=20):
    """Split an image into 16 equal tiles"""
    tiles = []
    for y in range(0, img.height, tile_size):
        for x in range(0, img.width, tile_size):
            tile = img.crop((x, y, x + tile_size, y + tile_size))
            tiles.append(tile)
    return tiles

# Load and process tile images
tiles_folder = "small_images"
input_tile_size = 80  # Original size of input images
output_tile_size = 20  # Size of tiles after splitting
tiles = []
tile_colors = []

# Load all tiles, split them, and calculate their average colors
for filename in os.listdir(tiles_folder):
    if filename.lower().endswith('.jpg'):
        img_path = os.path.join(tiles_folder, filename)
        img = Image.open(img_path)
        # Split each image into 16 tiles
        small_tiles = split_image_into_tiles(img, output_tile_size)
        tiles.extend(small_tiles)
        # Calculate average color for each small tile
        tile_colors.extend([get_average_color(tile) for tile in small_tiles])

# Load and resize reference image
target_height = 80  # Adjust this value to control final mosaic size
reference = Image.open("reference2.png")
aspect_ratio = reference.width / reference.height
target_width = int(target_height * aspect_ratio)
reference = reference.resize((target_width, target_height))

# Create output image
output_width = target_width * output_tile_size
output_height = target_height * output_tile_size
mosaic = Image.new('RGB', (output_width, output_height))

# Create lists of available indices
available_indices = list(range(len(tiles)))

skip_pixels = [
    (255, 255, 255, 255),
    # (144, 241, 239, 255),
    # (255, 214, 224, 255),
    # (255, 239, 159, 255),
    # (193, 251, 164, 255),
    # (123, 241, 168, 255),
]

# For each pixel in reference image, find best matching tile
for y in tqdm(range(target_height), desc="Creating mosaic"):
    for x in range(target_width):
        # Check if we've run out of tiles
        if not available_indices:
            print(f"Warning: Ran out of tiles at position ({x}, {y}). Mosaic may be incomplete.")
            break
            
        # Get the color of the reference pixel
        ref_color = reference.getpixel((x, y))
        
        # Skip if pixel exactly matches a skip color
        skip = False
        for skip_color in skip_pixels:
            if color_distance(ref_color, skip_color) < 2:
                # Fill with white
                mosaic.paste(Image.new('RGB', (output_tile_size, output_tile_size), 'white'),
                           (x * output_tile_size, y * output_tile_size))
                skip = True
                break
        if skip:
            continue
            
        # Find the tile with the closest average color from remaining tiles
        best_index = min(available_indices,
                        key=lambda i: color_distance(tile_colors[i], ref_color))
        
        # Paste the tile into the correct position
        mosaic.paste(tiles[best_index], 
                    (x * output_tile_size, y * output_tile_size))
        
        # Remove the used tile index
        available_indices.remove(best_index)

# Save the final mosaic
mosaic.save("mosaic_output.jpg")