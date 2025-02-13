import { PuzzlePiece } from './puzzle_piece.js';
import { scaleImage } from './image_generation.js';

export class GameManager {
    constructor(image, rows, cols) {
        this.image = image;
        this.rows = rows;
        this.cols = cols;

        this.selectedPiece = null;  
        this.raf = null;

        this.puzzleCanvas = document.querySelector('.puzzle-canvas');
        this.puzzleCtx = this.puzzleCanvas.getContext('2d');
        this.screenWidth = this.puzzleCanvas.width;
        this.screenHeight = this.puzzleCanvas.height;

        // Initial game setup
        this.totalPieces = this.rows * this.cols;
        this.scalePuzzleCanvas();
        this.puzzleBoard = scaleImage(this.image, this.screenWidth, this.screenHeight, 0.7);
        this.createPieces();
        this.display();
        this.addEventListeners();
    }

    // Scale Puzzle canvas for high resolution screens
    scalePuzzleCanvas() {
        const dpr = window.devicePixelRatio || 1;

        // calculate screen dimensions for the game pieces
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight - document.querySelector('.navbar').offsetHeight;
    
        this.puzzleCanvas.width = this.screenWidth * dpr;
        this.puzzleCanvas.height = this.screenHeight * dpr;
        this.puzzleCtx.scale(dpr, dpr);

        // set CSS size to match the visible size
        this.puzzleCanvas.style.width = `${this.screenWidth}px`;
        this.puzzleCanvas.style.height = `${this.screenHeight}px`;

    }

    // Create puzzle pieces
    createPieces() {       
        const pieceWidth = this.puzzleBoard.width / this.cols;
        const pieceHeight = this.puzzleBoard.height / this.rows;
        
        // pieces array for drawing pieces to canvas, grid 2d array for quick access to pieces
        this.pieces = [];
        this.grid  = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {

                // create puzzle piece object with constant variables
                const piece = new PuzzlePiece({
                    id: row * this.cols + col,
                    correctX: this.puzzleBoard.x + col * pieceWidth,
                    correctY: this.puzzleBoard.y + row * pieceHeight,
                    width: pieceWidth,
                    height: pieceHeight,
                    col: col,
                    row: row,
                    cols: this.cols,
                    rows: this.rows,
                });

                // initialize remaining piece variables
                piece.initialize(this.screenWidth, this.screenHeight);

                // create the shape of the piece
                piece.generateShape(this.grid); 

                this.pieces.push(piece);
                this.grid[row][col] = piece;
            }
        }
    }

    // Draw puzzle to canvas
    display() {
        this.puzzleCtx.clearRect(0, 0, this.puzzleCanvas.width, this.puzzleCanvas.height);

        // draw puzzle board
        this.puzzleCtx.fillStyle = 'white';
        this.puzzleCtx.fillRect(this.puzzleBoard.x, this.puzzleBoard.y, this.puzzleBoard.width, this.puzzleBoard.height);

        // draw border around the board
        this.puzzleCtx.strokeStyle = '#5a4b72';
        this.puzzleCtx.lineWidth = 1;
        this.puzzleCtx.strokeRect(this.puzzleBoard.x, this.puzzleBoard.y, this.puzzleBoard.width, this.puzzleBoard.height);

        // draw each puzzle piece
        this.pieces.forEach(piece => piece.draw(this.image, this.puzzleCtx));
    }
    

    addEventListeners() {
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        this.puzzleCanvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.puzzleCanvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.puzzleCanvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    // Event listener for when a puzzle piece is selected
    onMouseDown(e) {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const piece = this.pieces[i];

            // can't move piece after snapped
            if (piece.snapped) continue;

            // check if piece is where the mouse has pressed
            if(piece.contains(mouseX, mouseY)) {
                this.selectedPiece = piece;

                // calculate offset of piece from mouse
                this.selectedPiece.offsetX = mouseX - this.selectedPiece.x;
                this.selectedPiece.offsetY = mouseY - this.selectedPiece.y;
             
                // update layer of piece/group so they move to top
                for (let piece of this.selectedPiece.group) piece.layer = Date.now();

                // sort pieces so selected piece/pieces are drawn on top
                this.pieces.sort((a, b) => a.layer - b.layer);

                // start the animation loop once a piece is selected
                if (!this.raf) this.raf = requestAnimationFrame(() => this.animationLoop());
                break;
            }
        }

    }

    // Event listener for when a puzzle piece is being moved
    onMouseMove(e) {
        if (this.selectedPiece) {
            
            // calculate the new position
            let newX = e.offsetX - this.selectedPiece.offsetX;
            let newY = e.offsetY - this.selectedPiece.offsetY;
    
            // clamp the position within canvas bounds
            newX = Math.max(0, Math.min(newX, this.screenWidth - this.selectedPiece.width));
            newY = Math.max(0, Math.min(newY, this.screenHeight - this.selectedPiece.height));
    
            this.selectedPiece.updatePosition(newX, newY);
        }
    }

    // Event listener for when a puzzle piece is placed (deselected)
    onMouseUp() {
        if (this.selectedPiece) {

            // snap to correct position if close enough
            if (this.selectedPiece.isInPosition()) {
                this.selectedPiece.snapPosition();
                this.pieces.sort((a, b) => a.layer - b.layer);

                // check count of total pieces that are not in correct position
                this.totalPieces -= this.selectedPiece.group.size;
                if (this.totalPieces == 0) this.wonGame();

            // check for adjacent pieces to snap to
            } else this.selectedPiece.snapAdjacentPieces(this.grid);

            this.selectedPiece = null;
        }
    }

    // Continuously draw when moving a puzzle piece
    animationLoop() {
        // draw canvas
        this.display();
    
        // continue the animation loop if a piece is selected
        if (this.selectedPiece) {
            this.raf = requestAnimationFrame(() => this.animationLoop());
        } else {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
    }
    
    // Update puzzle canvas on screen resize
    resizeCanvas() {
        const oldBoard = { ...this.puzzleBoard };

        this.scalePuzzleCanvas();
        this.puzzleBoard = scaleImage(this.image, this.screenWidth, this.screenHeight, 0.7);

        const scaleX = this.puzzleBoard.width / oldBoard.width;
        const scaleY = this.puzzleBoard.height / oldBoard.height;

        // update positions of all puzzle pieces relative to the new puzzle board
        this.pieces.forEach(piece => {

            piece.x = this.puzzleBoard.x + (piece.x - oldBoard.x) * scaleX;
            piece.y = this.puzzleBoard.y + (piece.y - oldBoard.y) * scaleY;

            // ensure pieces stay within the canvas bounds
            piece.x = Math.max(0, Math.min(piece.x, this.screenWidth - piece.width));
            piece.y = Math.max(0, Math.min(piece.y, this.screenHeight - piece.height));
            
            piece.correctX = this.puzzleBoard.x + (piece.col / this.cols) * this.puzzleBoard.width;
            piece.correctY = this.puzzleBoard.y + (piece.row / this.rows) * this.puzzleBoard.height;
            
            piece.width = this.puzzleBoard.width / this.cols;
            piece.height = this.puzzleBoard.height / this.rows;
                        

        });

        // draw updated canvas
        this.display();
    }

    // Shuffle pieces when playing after win
    resetPieces() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const piece = this.grid[row][col];
                piece.initialize(this.screenWidth, this.screenHeight);

                // create the shape of the piece
                piece.generateShape(this.grid); 
            }
        }

        this.selectedPiece = null;
        this.totalPieces = this.rows * this.cols;

        // draw updated canvas
        this.display();
    }

    // Clear canvas and reset puzzle with new image
    newPuzzle(newImage) {
        this.puzzleCtx.clearRect(0, 0, this.puzzleCanvas.width, this.puzzleCanvas.height);
        this.image = newImage;
        this.selectedPiece = null;
        this.totalPieces = this.rows * this.cols;

        this.puzzleBoard = scaleImage(this.image, this.screenWidth, this.screenHeight, 0.7);
        this.createPieces();
        this.display();
    }

    // Update rows and cols of puzzle on settings update
    updateGrid(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.totalPieces = this.rows * this.cols;

        this.createPieces();
        this.display();

    }
  
    // Display win modal
    wonGame() {
        const winModal = document.getElementById('win-modal');
        winModal.style.display = 'flex';
    }
}