import { uploadImage, loadImage, generateImage } from "./js/image_generation.js";
import { GameManager } from "./js/game_manager.js";

// Game variables
let currentGame = null;
let image = null;
let rows = document.getElementById('rows-input').value;
let cols = document.getElementById('columns-input').value;

// Start a new puzzle
async function startNewPuzzle(imageSource) {
    try {
        // load uploaded or generated image
        image = await loadImage(imageSource);

        // initialize a new game or reset the puzzle with the new image
        if (!currentGame) {
            document.getElementById('no-image-message').style.display = 'none';
            currentGame = new GameManager(image, rows, cols);
        } else currentGame.newPuzzle(image);

    } catch (error) {
        console.error('Failed to start new puzzle:', error.message);
        alert('Error starting new puzzle. Please try again.');
    }
}


// Styles array from api
const styles = [
    "3d-model",
    "analog-film",
    "anime",
    "cinematic",
    "comic-book",
    "digital-art",
    "enhance",
    "fantasy-art",
    "isometric",
    "line-art",
    "low-poly",
    "modeling-compound",
    "neon-punk",
    "origami",
    "photographic",
    "pixel-art",
    "tile-texture"
];

// Populate dropdown with styles
styles.forEach(style => {
    const option = document.createElement('option');
    option.value = style;
    option.textContent = style;
    document.getElementById('style-select').appendChild(option);
});

// Navbar Hamburger Menu
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navbarButtons = document.querySelector('.navbar-buttons');

hamburgerMenu.addEventListener('click', () => {
    navbarButtons.classList.toggle('active');
});

// Function to toggle modal visibility
function toggleModal(modal, isVisible) {
    modal.style.display = isVisible ? 'flex' : 'none';
}

// Open and close the generate image modal
const generateImageModal = document.getElementById('generate-image-modal');
document.getElementById('generate-image-btn').addEventListener('click', () => toggleModal(generateImageModal, true));
document.getElementById('close-generate-modal').addEventListener('click', () => toggleModal(generateImageModal, false));

// Open and close the settings modal
const settingsModal = document.getElementById('settings-modal');
document.getElementById('settings-btn').addEventListener('click', () => toggleModal(settingsModal, true));
document.getElementById('close-settings-modal').addEventListener('click', () => toggleModal(settingsModal, false));

// Open and close the settings modal
const winModal = document.getElementById('win-modal');
document.getElementById('close-win-modal').addEventListener('click', () => toggleModal(winModal, false));

// Close modals if clicking outside the modal content
window.addEventListener('click', (e) => {
    if (e.target === generateImageModal) toggleModal(generateImageModal, false);
    if (e.target === settingsModal) toggleModal(settingsModal, false);   
    if (e.target === winModal) toggleModal(winModal, false);
});

// Open and close the show image modal
const imageModal = document.getElementById('show-image-modal');
document.getElementById('show-image-btn').addEventListener('click', () => toggleModal(imageModal, true));
document.getElementById('close-image-modal').addEventListener('click', () => toggleModal(imageModal, false));

// Ensure show image modal in screen bounds on resize
window.addEventListener('resize', () => {
    let x = imageModal.offsetLeft;
    let y = imageModal.offsetTop;
    x = Math.max(0, Math.min(x, window.innerWidth - imageModal.offsetWidth));
    y = Math.max(0, Math.min(y, window.innerHeight - imageModal.offsetHeight));

    imageModal.style.left = `${x}px`;
    imageModal.style.top = `${y}px`;
});


// Add dragging and resizing functionality for show image modal
let offsetX, offsetY;
let isDragging = false;
let isResizing = false;

document.querySelector('.resizing').addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizing = true;
});

// Event listener for when show image modal is selected
imageModal.addEventListener('mousedown', (e) => {
    e.preventDefault();

    if (isResizing) return;
    isDragging = true;

    offsetX = e.clientX - imageModal.offsetLeft;
    offsetY = e.clientY - imageModal.offsetTop;
    imageModal.style.cursor = 'grabbing';
});

// Event listener for resizing or moving show image modal
document.addEventListener('mousemove', (e) => {
    e.preventDefault();        

    if (isResizing) {
        const rect = imageModal.getBoundingClientRect();
        imageModal.style.width = `${e.clientX - rect.left}px`;
        imageModal.style.height = `${e.clientY - rect.top}px`;
    }
    
    if (isDragging) {
        // calculate new position, keep without bounds of screen
        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;

        x = Math.max(0, Math.min(x, window.innerWidth - imageModal.offsetWidth));
        y = Math.max(0, Math.min(y, window.innerHeight - imageModal.offsetHeight));

        imageModal.style.left = `${x}px`;
        imageModal.style.top = `${y}px`;
    }
});

// Event listener for deselecting show image modal
document.addEventListener('mouseup', () => {
    if (isResizing) isResizing = false;

    if (isDragging) {
        isDragging = false;
        imageModal.style.cursor = 'grab'; 
    }
});

// Play Again Button
document.getElementById('play-again-btn').addEventListener('click', () => {
    currentGame.resetPieces();
    toggleModal(winModal, false);
});

// Upload Image Button
document.getElementById('upload-image-btn').addEventListener('click', () => {
    uploadImage((imageSource) => {
        startNewPuzzle(imageSource);
    });

});

// Show Image Button
document.getElementById('show-image-btn').addEventListener('click', () => {
    if (image) {
        const displayImage = document.getElementById('image-display');
        displayImage.src = image.src;
    }
});

// Save Settings
document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();

    rows = document.getElementById('rows-input').value;
    cols = document.getElementById('columns-input').value;
    if (currentGame) currentGame.updateGrid(rows, cols);

    // close modal after submission
    toggleModal(settingsModal, false);
});

// Submit Generation Details
document.getElementById('generate-image-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const imageDescription = document.getElementById('image-description').value.trim();
    const imageStyle = document.getElementById('style-select').value;

    // while generating, show loading spinner and update button text
    const generateButton = document.getElementById('submit-generation');
    const generateText = document.getElementById('generate-text');
    const generateSpinner = document.getElementById('generate-spinner');

    generateButton.disabled = true; 
    generateText.textContent = 'Generating'; 
    generateSpinner.style.display = 'inline-block'; 

        
    try {
        const imageSource = await generateImage(imageDescription, imageStyle);
        startNewPuzzle(imageSource);

    } catch (error) {
        console.error('Failed to generate image:', error.message);
        alert('Failed to generate image. Please try again.');
    } finally {

        // reset form fields
        document.getElementById('generate-image-form').reset();

        // after generating, reset button and hide spinner
        generateButton.disabled = false;
        generateText.textContent = 'Generate';
        generateSpinner.style.display = 'none';   
            
        // close modal after submission
        toggleModal(generateImageModal, false);
    }

});
