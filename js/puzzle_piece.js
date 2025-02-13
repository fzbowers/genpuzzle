export class PuzzlePiece {
    constructor(obj) {
        this.id = obj.id;

        this.correctX = obj.correctX;
        this.correctY = obj.correctY;
        
        this.width = obj.width;
        this.height = obj.height;

        this.col = obj.col;
        this.row = obj.row;

        this.cols = obj.cols;
        this.rows = obj.rows;
    }

    initialize(screenWidth, screenHeight) {
        // set piece position randomly
        this.x = Math.random() * (screenWidth - this.width);
        this.y = Math.random() * (screenHeight - this.height);

        this.offsetX = 0;
        this.offsetY = 0;

        this.layer = 0; // for order of drawing puzzle pieces
        this.shape = [0, 0, 0, 0]; // top, right, bottom, left side of piece

        this.snapped = false;
        this.group = new Set([this]); // group of connected pieces that includes this piece
        
        // the [row, col] locations of pieces that are directly connected to this piece
        // and have not yet connected
        this.neighbors = [];
        this.calculateNeighbors();
    }

    // Save the neighboring (top, bottom, left, right) puzzle piece locations
    calculateNeighbors() {
        if (this.row > 0) this.neighbors.push([this.row-1, this.col]);
        if (this.row < this.rows-1) this.neighbors.push([this.row+1, this.col]);
        if (this.col > 0) this.neighbors.push([this.row, this.col-1]);
        if (this.col < this.cols-1) this.neighbors.push([this.row, this.col+1]);
        
    }

    // Check if the mouse is inside the piece
    contains(mouseX, mouseY) {
        return (
            mouseX >= this.x &&
            mouseX <= this.x + this.width &&
            mouseY >= this.y &&
            mouseY <= this.y + this.height
        );
    }

    // Update piece position and any connected pieces
    updatePosition(newX, newY) {
        // distance the piece moved
        const dx = newX - this.x;
        const dy = newY - this.y;
        this.x = newX;
        this.y = newY;

        // update positions for group
        for (let piece of this.group) {
            if (piece !== this) {
                piece.x += dx;
                piece.y += dy;
            }
        }
    }

    // Check if piece is in its correct position on the puzzle board
    isInPosition(tolerance = 10) {
        return (
            Math.abs(this.x - this.correctX) <= tolerance &&
            Math.abs(this.y - this.correctY) <= tolerance
        );
    }

    // Check if other piece is above, below, left, or right of current piece
    // Also check that position of pieces match their correct positions
    isAdjacent(otherPiece, tolerance = 10) {

        // check if the pieces are horizontally adjacent (left or right)
        const horizAdjacent =
        Math.abs(this.y - otherPiece.y) <= tolerance &&
        ((Math.abs((this.x + this.width) - otherPiece.x) <= tolerance && this.correctX < otherPiece.correctX) || 
        (Math.abs(this.x - (otherPiece.x + otherPiece.width)) <= tolerance && otherPiece.correctX < this.correctX));

                
        // check if the pieces are vertically adjacent (top or bottom)
        const vertAdjacent =
            Math.abs(this.x - otherPiece.x) <= tolerance &&
            ((Math.abs((this.y + this.height) - otherPiece.y) <= tolerance && this.correctY < otherPiece.correctY) || 
            (Math.abs(this.y - (otherPiece.y + otherPiece.height)) <= tolerance && otherPiece.correctY < this.correctY));
    
        // Return true if they are either horizontally or vertically adjacent on screen and on correct image
        return horizAdjacent || vertAdjacent;
    }

    // Check if neighboring pieces are close to the current piece/current group and connect if true
    snapAdjacentPieces(grid) {
        let newX, newY;
        const originalGroup = this.group;

        // loops through each piece of the group and their neighbors, to see if any pieces near by can connect
        for (let piece of originalGroup) {

            if (!piece.neighbors) continue;
            
            // save original neighbors to account for updates from grouping
            const originalNeighbors = [...piece.neighbors];

            for (let i = 0; i < originalNeighbors.length; i++) {
                const [row, col] = originalNeighbors[i];
                const otherPiece = grid[row][col];            
                
                // check if the neighbor is near the current piece
                if(!piece.group.has(otherPiece) && piece.isAdjacent(otherPiece)) {
                    newX = piece.x;
                    newY = piece.y;

                    // verify that the neighboring piece is on the correct side to connect
                    // calculate new position, directly connecting to current piece
                    if (piece.row === otherPiece.row) {
                        if (piece.correctX < otherPiece.correctX) newX = piece.x + piece.width;
                        else newX = piece.x - piece.width;

                    } else if (piece.col === otherPiece.col) {
                        if (piece.correctY < otherPiece.correctY) newY = piece.y + piece.height;
                        else newY = piece.y - piece.height;
                    }

                    // uppdate the position of the neighboring piece
                    otherPiece.updatePosition(newX, newY);
                    
                    // group the pieces together
                    piece.groupWith(otherPiece, grid);
                }
            }                
        }
    }

    // Combine the groups of current and other piece
    // Remove neighbors once they share a group
    groupWith(otherPiece, grid) {
        const mergedGroup = new Set([...this.group, ...otherPiece.group]);
        
        for (let piece of mergedGroup) {
            piece.group = mergedGroup;

            for (let i = piece.neighbors.length - 1; i >= 0; i--) {
                const [row, col] = piece.neighbors[i];
                const neighbor = grid[row][col];

                if (mergedGroup.has(neighbor)) piece.neighbors.splice(i, 1);
            }
        }
    }

    // Snap piece into its correct position 
    snapPosition() {
        this.updatePosition(this.correctX, this.correctY);
        for (let piece of this.group) {
            piece.snapped = true;
            piece.layer = -1;
        }
    }

    // Calculate the shape of the puzzle piece
    // 1 = protrusions, -1 = indentations, 0 = straight
    generateShape(grid) {

        // top side, straight for border otherwise fit to the piece above
        if (this.row == 0) this.shape[0] = 0;
        else this.shape[0] = -grid[this.row-1][this.col].shape[2];

        // right side, straight for border otherwise randomly select a shape
        if (this.col == this.cols - 1) this.shape[1] = 0;
        else this.shape[1] = Math.random() >= 0.5 ? 1 : -1;

        // bottom side, straight for border otherwise randomly select a shape 
        if (this.row == this.rows - 1) this.shape[2] = 0;
        else this.shape[2] = Math.random() >= 0.5 ? 1 : -1;

        // left side, straight for border otherwise fit to the piece to the left
        if (this.col == 0) this.shape[3] = 0;
        else this.shape[3] = -grid[this.row][this.col-1].shape[1];
    }

    
    // Draw the puzzle piece to the canvas
    draw(image, ctx) {
        const linkScale = 0.2;
        const imageWidth = image.width / this.cols;
        const imageHeight = image.height / this.rows; 

        // calculate the size of the puzzle links, currently the same size (possibly different)
        const horizLink = (this.width + this.height) / 2 * linkScale;
        const vertLink = (this.width + this.height) / 2 * linkScale;

        // calculate the size of the puzzle links scaled to the image
        const imageHorizLink = imageHeight * horizLink / this.height;
        const imageVertLink = imageWidth * vertLink / this.width;
        

        // save canvas state
        ctx.save();

        // move/translate to the piece's position
        ctx.translate(this.x, this.y);
        this.drawJigsaw(ctx, horizLink, vertLink);

        ctx.drawImage(
            image,
            this.col * imageWidth - imageHorizLink, this.row * imageHeight - imageVertLink,
            imageWidth + 2 * imageHorizLink, imageHeight + 2 * imageVertLink,
            -horizLink, -vertLink,
            this.width + 2 * horizLink, this.height + 2 * vertLink,
        );

        ctx.restore();

        // add outline of piece
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }

    // Draw the jigsaw shape for each side of the puzzle piece
    drawJigsaw(ctx, horizLink, vertLink) {

        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);

        // top side of piece
        ctx.lineTo(halfWidth - (vertLink/2), 0);

        ctx.bezierCurveTo(
            halfWidth - (vertLink/2), 0,
            halfWidth - vertLink, -vertLink * this.shape[0],
            halfWidth, -vertLink * this.shape[0]            
        );        
        
        ctx.bezierCurveTo(
            halfWidth, -vertLink * this.shape[0],
            halfWidth + vertLink, -vertLink * this.shape[0],
            halfWidth + (vertLink/2), 0
        );

        ctx.lineTo(this.width, 0);

        // right side of piece
        ctx.lineTo(this.width, halfHeight - (horizLink/2));

        ctx.bezierCurveTo(
            this.width, halfHeight - (horizLink/2),
            this.width + horizLink * this.shape[1], halfHeight - horizLink,
            this.width + horizLink * this.shape[1], halfHeight
        );
        ctx.bezierCurveTo(
            this.width + horizLink * this.shape[1], halfHeight, 
            this.width + horizLink * this.shape[1], halfHeight + horizLink, 
            this.width, halfHeight + (horizLink/2)
        );

        ctx.lineTo(this.width, this.height);

        // bottom side of piece
        ctx.lineTo(halfWidth + (vertLink/2), this.height);

        ctx.bezierCurveTo(
            halfWidth + (vertLink/2), this.height,
            halfWidth + vertLink, this.height + vertLink * this.shape[2],
            halfWidth, this.height + vertLink * this.shape[2]            
        );        
        
        ctx.bezierCurveTo(
            halfWidth, this.height + vertLink * this.shape[2],
            halfWidth - vertLink, this.height + vertLink * this.shape[2],
            halfWidth - (vertLink/2), this.height
        );

        ctx.lineTo(0, this.height);

        // left side of piece
        ctx.lineTo(0, halfHeight + (horizLink/2));

        ctx.bezierCurveTo(
            0, halfHeight + (horizLink/2),
            -horizLink * this.shape[3], halfHeight + horizLink,
            -horizLink * this.shape[3], halfHeight
        );
        ctx.bezierCurveTo(
            -horizLink * this.shape[3], halfHeight, 
            -horizLink * this.shape[3], halfHeight - horizLink, 
            0, halfHeight - (horizLink/2)
        );

        ctx.lineTo(0, 0);

        ctx.closePath();
        ctx.clip();     
    }

}