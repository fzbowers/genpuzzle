
// Function to handle image generation
export async function generateImage(prompt, style = "") {
    try {
        const response = await fetch('https://genpuzzle-backend-production.up.railway.app/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                // aspect_ratio: "1:1", 
                // output_format: "png",
                style_preset: style || undefined
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate image');
        }

        // return the generated image URL
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error(`Error generating image: ${error.message}`);
        throw error;
    }
}

// Funtion to handle image upload
export function uploadImage(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Create an image URL from the file
            const blobURL = URL.createObjectURL(file);
            callback(blobURL);
        }
    };

    input.click();
}


// Funtion to create the puzzle board by scaling the original image to fit the screen
export function scaleImage(image, totalWidth, totalHeight, max) {

    if (!image) {
        console.error('No image element provided for scaling');
        return;
    }

    let scaledWidth, scaledHeight;
    const aspectRatio = image.width / image.height;

    const maxWidth = totalWidth * max;
    const maxHeight = totalHeight * max;

    if (maxHeight < maxWidth) {
        scaledWidth = maxHeight;
        scaledHeight = maxHeight;
    } else {
        scaledWidth = maxWidth;
        scaledHeight = maxWidth;
    }

     if (aspectRatio > 1) {
        // wider image: Make width 70% of container width

        do {
            scaledHeight = scaledWidth / aspectRatio;

            if (scaledHeight > maxHeight) {
                scaledWidth--;
            }
        } while (scaledHeight > maxHeight);

    } else if (aspectRatio < 1) {
        // taller image: Make height 70% of container height
        do {
            scaledWidth = scaledHeight / aspectRatio;

            if (scaledWidth > maxWidth) {
                scaledHeight--;
            }
        } while (scaledWidth > maxWidth);
    }

    // calculate the position to center the board on the screen
    const x = (totalWidth - scaledWidth) / 2;
    const y = (totalHeight - scaledHeight) / 2;

    // dimensions of puzzle board
    return {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
    };
}


// Function to load the image URL
export async function loadImage(imageSource) {
    if (!imageSource) throw new Error('Invalid image source');

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image from ${imageSource}`));
        img.src = imageSource;
    });
}