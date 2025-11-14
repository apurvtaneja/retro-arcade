// Mobile Detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (window.innerWidth <= 768);

// Utility function to resize canvas responsively
function resizeCanvas(canvas, baseWidth, baseHeight) {
    const maxWidth = Math.min(window.innerWidth - 40, baseWidth);
    const maxHeight = Math.min(window.innerHeight * 0.6, baseHeight);
    const scale = Math.min(maxWidth / baseWidth, maxHeight / baseHeight, 1);
    
    canvas.style.width = (baseWidth * scale) + 'px';
    canvas.style.height = (baseHeight * scale) + 'px';
    // Keep internal canvas dimensions at base size for proper rendering
    if (canvas.width !== baseWidth) canvas.width = baseWidth;
    if (canvas.height !== baseHeight) canvas.height = baseHeight;
}

// Game Manager
class GameManager {
    constructor() {
        this.currentGame = null;
        this.gameInstances = {};
        this.init();
    }

    init() {
        // Menu buttons
        const menuButtons = document.querySelectorAll('.arcade-btn[data-game]');
        menuButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameName = e.currentTarget.dataset.game;
                this.startGame(gameName);
            });
        });

        // Return button
        document.getElementById('return-btn').addEventListener('click', () => {
            this.returnToMenu();
        });

        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentGame) {
                this.returnToMenu();
            }
        });
    }

    startGame(gameName) {
        // Hide menu
        document.getElementById('game-menu').classList.remove('active');
        document.getElementById('game-container').style.display = 'block';

        // Hide all games
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show selected game
        const gameScreen = document.getElementById(`${gameName}-game`);
        gameScreen.classList.add('active');

        // Show touch controls on mobile
        if (isMobile) {
            const touchControls = document.getElementById(`${gameName}-controls`);
            if (touchControls) {
                touchControls.classList.add('active');
            }
        }

        // Initialize game if not already initialized
        if (!this.gameInstances[gameName]) {
            switch(gameName) {
                case 'snake':
                    this.gameInstances[gameName] = new SnakeGame();
                    break;
                case 'pong':
                    this.gameInstances[gameName] = new PongGame();
                    break;
                case 'tetris':
                    this.gameInstances[gameName] = new TetrisGame();
                    break;
                case 'invaders':
                    this.gameInstances[gameName] = new SpaceInvadersGame();
                    break;
            }
        }

        this.currentGame = gameName;
        this.gameInstances[gameName].start();
    }

    endGame() {
        if (this.currentGame && this.gameInstances[this.currentGame]) {
            this.gameInstances[this.currentGame].stop();
        }
        
        // Hide game
        document.getElementById('game-container').style.display = 'none';
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show end screen
        document.getElementById('end-screen').classList.add('active');
    }

    returnToMenu() {
        // Stop current game
        if (this.currentGame && this.gameInstances[this.currentGame]) {
            this.gameInstances[this.currentGame].stop();
        }

        // Hide end screen
        document.getElementById('end-screen').classList.remove('active');

        // Hide game container
        document.getElementById('game-container').style.display = 'none';
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Hide touch controls
        document.querySelectorAll('.touch-controls').forEach(controls => {
            controls.classList.remove('active');
        });

        // Show menu
        document.getElementById('game-menu').classList.add('active');
        this.currentGame = null;
    }
}

// Snake Game
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.baseWidth = 600;
        this.baseHeight = 600;
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [{x: 10, y: 10}];
        this.food = {x: 15, y: 15};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameLoop = null;
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    init() {
        // Resize canvas for mobile
        if (isMobile) {
            resizeCanvas(this.canvas, this.baseWidth, this.baseHeight);
            window.addEventListener('resize', () => {
                resizeCanvas(this.canvas, this.baseWidth, this.baseHeight);
            });
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameLoop) return;
            this.keys[e.key] = true;
            
            if (e.key === 'ArrowUp' && this.dy !== 1) {
                this.dx = 0;
                this.dy = -1;
            } else if (e.key === 'ArrowDown' && this.dy !== -1) {
                this.dx = 0;
                this.dy = 1;
            } else if (e.key === 'ArrowLeft' && this.dx !== 1) {
                this.dx = -1;
                this.dy = 0;
            } else if (e.key === 'ArrowRight' && this.dx !== -1) {
                this.dx = 1;
                this.dy = 0;
            }
        });

        // Touch controls
        const controls = document.getElementById('snake-controls');
        if (controls) {
            controls.querySelectorAll('[data-direction]').forEach(btn => {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const dir = btn.dataset.direction;
                    if (dir === 'up' && this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    } else if (dir === 'down' && this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    } else if (dir === 'left' && this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    } else if (dir === 'right' && this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                });
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const dir = btn.dataset.direction;
                    if (dir === 'up' && this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    } else if (dir === 'down' && this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    } else if (dir === 'left' && this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    } else if (dir === 'right' && this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                });
            });
        }

        // Swipe gestures
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.touchStartX || !this.touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = this.touchStartX - touchEndX;
            const diffY = this.touchStartY - touchEndY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 30 && this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                } else if (diffX < -30 && this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
            } else {
                if (diffY > 30 && this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                } else if (diffY < -30 && this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
            }
            
            this.touchStartX = 0;
            this.touchStartY = 0;
        });
    }

    start() {
        this.snake = [{x: 10, y: 10}];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.updateScore();
        this.init();
        this.gameLoop = setInterval(() => this.update(), 150);
    }

    stop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    generateFood() {
        return {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
    }

    update() {
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};

        // Wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Self collision (skip the head itself)
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        // Food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#003333';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffff';
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.fillStyle = '#00ffff';
            } else {
                this.ctx.fillStyle = '#00aaaa';
            }
            this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        });
        this.ctx.shadowBlur = 0;

        // Draw food
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.fillRect(this.food.x * this.gridSize + 1, this.food.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        this.ctx.shadowBlur = 0;
    }

    updateScore() {
        document.getElementById('snake-score').textContent = this.score;
    }

    gameOver() {
        this.stop();
        setTimeout(() => gameManager.endGame(), 500);
    }
}

// Pong Game
class PongGame {
    constructor() {
        this.canvas = document.getElementById('pong-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.baseWidth = 800;
        this.baseHeight = 400;
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
        
        this.paddleHeight = 80;
        this.paddleWidth = 10;
        this.ballSize = 10;
        
        this.playerY = this.canvas.height / 2 - this.paddleHeight / 2;
        this.aiY = this.canvas.height / 2 - this.paddleHeight / 2;
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = 5;
        this.ballSpeedY = 5;
        
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameLoop = null;
        this.keys = {};
    }

    init() {
        // Resize canvas for mobile
        if (isMobile) {
            resizeCanvas(this.canvas, this.baseWidth, this.baseHeight);
            window.addEventListener('resize', () => {
                resizeCanvas(this.canvas, this.baseWidth, this.baseHeight);
            });
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameLoop) return;
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Touch controls
        const controls = document.getElementById('pong-controls');
        if (controls) {
            controls.querySelectorAll('[data-action]').forEach(btn => {
                const action = btn.dataset.action;
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.keys[action === 'up' ? 'w' : 's'] = true;
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.keys[action === 'up' ? 'w' : 's'] = false;
                });
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.keys[action === 'up' ? 'w' : 's'] = true;
                });
                btn.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.keys[action === 'up' ? 'w' : 's'] = false;
                });
            });
        }
    }

    start() {
        this.playerY = this.canvas.height / 2 - this.paddleHeight / 2;
        this.aiY = this.canvas.height / 2 - this.paddleHeight / 2;
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
        this.ballSpeedY = 5 * (Math.random() > 0.5 ? 1 : -1);
        this.playerScore = 0;
        this.aiScore = 0;
        this.updateScore();
        this.init();
        this.gameLoop = setInterval(() => this.update(), 16);
    }

    stop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    update() {
        // Player movement
        if (this.keys['w'] && this.playerY > 0) {
            this.playerY -= 5;
        }
        if (this.keys['s'] && this.playerY < this.canvas.height - this.paddleHeight) {
            this.playerY += 5;
        }

        // AI movement
        const aiCenter = this.aiY + this.paddleHeight / 2;
        if (aiCenter < this.ballY - 10) {
            this.aiY += 4;
        } else if (aiCenter > this.ballY + 10) {
            this.aiY -= 4;
        }
        this.aiY = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.aiY));

        // Ball movement
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;

        // Ball collision with top/bottom
        if (this.ballY <= 0 || this.ballY >= this.canvas.height - this.ballSize) {
            this.ballSpeedY = -this.ballSpeedY;
        }

        // Ball collision with paddles
        if (this.ballX <= this.paddleWidth && 
            this.ballY + this.ballSize >= this.playerY && 
            this.ballY <= this.playerY + this.paddleHeight) {
            this.ballSpeedX = -this.ballSpeedX;
            this.ballSpeedX *= 1.1;
            this.ballSpeedY *= 1.1;
        }

        if (this.ballX >= this.canvas.width - this.paddleWidth - this.ballSize && 
            this.ballY + this.ballSize >= this.aiY && 
            this.ballY <= this.aiY + this.paddleHeight) {
            this.ballSpeedX = -this.ballSpeedX;
            this.ballSpeedX *= 1.1;
            this.ballSpeedY *= 1.1;
        }

        // Score
        if (this.ballX < 0) {
            this.aiScore++;
            this.updateScore();
            this.resetBall();
            if (this.aiScore >= 5) {
                this.gameOver();
                return;
            }
        }
        if (this.ballX > this.canvas.width) {
            this.playerScore++;
            this.updateScore();
            this.resetBall();
            if (this.playerScore >= 5) {
                this.gameOver();
                return;
            }
        }

        this.draw();
    }

    resetBall() {
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = 5 * (Math.random() > 0.5 ? 1 : -1);
        this.ballSpeedY = 5 * (Math.random() > 0.5 ? 1 : -1);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.ctx.strokeStyle = '#003333';
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw paddles
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.fillRect(0, this.playerY, this.paddleWidth, this.paddleHeight);
        this.ctx.fillRect(this.canvas.width - this.paddleWidth, this.aiY, this.paddleWidth, this.paddleHeight);
        this.ctx.shadowBlur = 0;

        // Draw ball
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.fillRect(this.ballX, this.ballY, this.ballSize, this.ballSize);
        this.ctx.shadowBlur = 0;
    }

    updateScore() {
        document.getElementById('pong-score').textContent = this.playerScore;
        document.getElementById('pong-ai-score').textContent = this.aiScore;
    }

    gameOver() {
        this.stop();
        setTimeout(() => gameManager.endGame(), 500);
    }
}

// Tetris Game
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetris-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.baseWidth = 300;
        this.baseHeight = 600;
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
        
        this.gridWidth = 10;
        this.gridHeight = 20;
        this.cellSize = this.canvas.width / this.gridWidth;
        
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
        this.currentPiece = null;
        this.score = 0;
        this.level = 1;
        this.gameLoop = null;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.keys = {};
    }

    init() {
        // Resize canvas for mobile
        if (isMobile) {
            resizeCanvas(this.canvas, this.baseWidth, this.baseHeight);
            window.addEventListener('resize', () => {
                resizeCanvas(this.canvas, this.baseWidth, this.baseHeight);
            });
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameLoop) return;
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'ArrowLeft') {
                this.movePiece(-1, 0);
            } else if (e.key === 'ArrowRight') {
                this.movePiece(1, 0);
            } else if (e.key === 'ArrowDown') {
                this.movePiece(0, 1);
            } else if (e.key === 'a' || e.key === 'A') {
                this.rotatePiece(-1);
            } else if (e.key === 'd' || e.key === 'D') {
                this.rotatePiece(1);
            }
        });

        // Touch controls
        const controls = document.getElementById('tetris-controls');
        if (controls) {
            controls.querySelectorAll('[data-action]').forEach(btn => {
                const action = btn.dataset.action;
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (action === 'left') {
                        this.movePiece(-1, 0);
                    } else if (action === 'right') {
                        this.movePiece(1, 0);
                    } else if (action === 'down') {
                        this.movePiece(0, 1);
                    } else if (action === 'rotate-left') {
                        this.rotatePiece(-1);
                    } else if (action === 'rotate-right') {
                        this.rotatePiece(1);
                    }
                });
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (action === 'left') {
                        this.movePiece(-1, 0);
                    } else if (action === 'right') {
                        this.movePiece(1, 0);
                    } else if (action === 'down') {
                        this.movePiece(0, 1);
                    } else if (action === 'rotate-left') {
                        this.rotatePiece(-1);
                    } else if (action === 'rotate-right') {
                        this.rotatePiece(1);
                    }
                });
            });
        }
    }

    start() {
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
        this.score = 0;
        this.level = 1;
        this.dropInterval = 1000;
        this.updateScore();
        this.spawnPiece();
        this.init();
        this.gameLoop = setInterval(() => this.update(), 16);
    }

    stop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    spawnPiece() {
        const shapes = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[0,1,0],[1,1,1]], // T
            [[0,1,1],[1,1,0]], // S
            [[1,1,0],[0,1,1]], // Z
            [[1,0,0],[1,1,1]], // J
            [[0,0,1],[1,1,1]]  // L
        ];
        
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        this.currentPiece = {
            shape: shape,
            x: Math.floor(this.gridWidth / 2) - Math.floor(shape[0].length / 2),
            y: 0
        };
    }

    movePiece(dx, dy) {
        if (this.canMove(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        return false;
    }

    rotatePiece(direction) {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        if (!this.canMove(this.currentPiece, 0, 0)) {
            this.currentPiece.shape = originalShape;
        }
    }

    canMove(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const gridX = newX + x;
                    const gridY = newY + y;
                    
                    if (gridX < 0 || gridX >= this.gridWidth || 
                        gridY >= this.gridHeight ||
                        (gridY >= 0 && this.grid[gridY][gridX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const gridY = this.currentPiece.y + y;
                    const gridX = this.currentPiece.x + x;
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = 1;
                    }
                }
            }
        }
        this.clearLines();
        this.spawnPiece();
        
        // Check game over
        if (!this.canMove(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = this.gridHeight - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell === 1)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.gridWidth).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.score / 1000) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateScore();
        }
    }

    update() {
        this.dropCounter += 16;
        if (this.dropCounter >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.dropCounter = 0;
        }
        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#003333';
        this.ctx.lineWidth = 1;
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw locked pieces
        this.ctx.fillStyle = '#00aaaa';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#00aaaa';
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillRect(x * this.cellSize + 1, y * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2);
                }
            }
        }
        this.ctx.shadowBlur = 0;

        // Draw current piece
        if (this.currentPiece) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ffff';
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const drawX = (this.currentPiece.x + x) * this.cellSize;
                        const drawY = (this.currentPiece.y + y) * this.cellSize;
                        if (drawY >= 0) {
                            this.ctx.fillRect(drawX + 1, drawY + 1, this.cellSize - 2, this.cellSize - 2);
                        }
                    }
                }
            }
            this.ctx.shadowBlur = 0;
        }
    }

    updateScore() {
        document.getElementById('tetris-score').textContent = this.score;
        document.getElementById('tetris-level').textContent = this.level;
    }

    gameOver() {
        this.stop();
        setTimeout(() => gameManager.endGame(), 500);
    }
}

// Space Invaders Game
class SpaceInvadersGame {
    constructor() {
        this.canvas = document.getElementById('invaders-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.baseWidth = 800;
        this.baseHeight = 600;
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
        
        this.player = {x: this.canvas.width / 2, y: this.canvas.height - 40, width: 40, height: 20};
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.score = 0;
        this.lives = 3;
        this.gameLoop = null;
        this.keys = {};
        this.enemyDirection = 1;
        this.enemySpeed = 1;
    }

    init() {
        // Resize canvas for mobile
        if (isMobile) {
            resizeCanvas(this.canvas, this.baseWidth, this.baseHeight);
            window.addEventListener('resize', () => {
                resizeCanvas(this.canvas, this.baseWidth, this.baseHeight);
            });
        }

        // Create enemies
        this.enemies = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 10; col++) {
                this.enemies.push({
                    x: col * 70 + 50,
                    y: row * 50 + 50,
                    width: 30,
                    height: 30
                });
            }
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameLoop) return;
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Touch controls
        const controls = document.getElementById('invaders-controls');
        if (controls) {
            controls.querySelectorAll('[data-action]').forEach(btn => {
                const action = btn.dataset.action;
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (action === 'shoot') {
                        this.shoot();
                    } else if (action === 'left') {
                        this.keys['ArrowLeft'] = true;
                    } else if (action === 'right') {
                        this.keys['ArrowRight'] = true;
                    }
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (action === 'left') {
                        this.keys['ArrowLeft'] = false;
                    } else if (action === 'right') {
                        this.keys['ArrowRight'] = false;
                    }
                });
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    if (action === 'shoot') {
                        this.shoot();
                    } else if (action === 'left') {
                        this.keys['ArrowLeft'] = true;
                    } else if (action === 'right') {
                        this.keys['ArrowRight'] = true;
                    }
                });
                btn.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    if (action === 'left') {
                        this.keys['ArrowLeft'] = false;
                    } else if (action === 'right') {
                        this.keys['ArrowRight'] = false;
                    }
                });
            });
        }
    }

    start() {
        this.player.x = this.canvas.width / 2;
        this.bullets = [];
        this.enemyBullets = [];
        this.score = 0;
        this.lives = 3;
        this.enemySpeed = 1;
        this.enemyDirection = 1;
        this.updateScore();
        this.init();
        this.gameLoop = setInterval(() => this.update(), 16);
    }

    stop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    shoot() {
        this.bullets.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y,
            width: 4,
            height: 10,
            speed: -8
        });
    }

    update() {
        // Player movement
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= 5;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += 5;
        }

        // Move enemies
        let shouldMoveDown = false;
        for (let enemy of this.enemies) {
            if ((enemy.x <= 0 && this.enemyDirection === -1) || 
                (enemy.x >= this.canvas.width - enemy.width && this.enemyDirection === 1)) {
                shouldMoveDown = true;
                break;
            }
        }

        if (shouldMoveDown) {
            this.enemyDirection *= -1;
            this.enemySpeed += 0.2;
            for (let enemy of this.enemies) {
                enemy.y += 20;
            }
        }

        for (let enemy of this.enemies) {
            enemy.x += this.enemySpeed * this.enemyDirection;
        }

        // Move bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y += bullet.speed;
            
            // Check collision with enemies
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    this.enemies.splice(i, 1);
                    this.score += 10;
                    this.updateScore();
                    return false;
                }
            }
            
            return bullet.y > 0;
        });

        // Enemy shooting
        if (Math.random() < 0.01 && this.enemies.length > 0) {
            const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            this.enemyBullets.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 10,
                speed: 3
            });
        }

        // Move enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed;
            
            // Check collision with player
            if (bullet.x < this.player.x + this.player.width &&
                bullet.x + bullet.width > this.player.x &&
                bullet.y < this.player.y + this.player.height &&
                bullet.y + bullet.height > this.player.y) {
                this.lives--;
                this.updateScore();
                if (this.lives <= 0) {
                    this.gameOver();
                    return false;
                }
                return false;
            }
            
            return bullet.y < this.canvas.height;
        });

        // Check if enemies reached player
        for (let enemy of this.enemies) {
            if (enemy.y + enemy.height >= this.player.y) {
                this.gameOver();
                return;
            }
        }

        // Win condition
        if (this.enemies.length === 0) {
            this.gameOver();
            return;
        }

        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 53) % this.canvas.height;
            this.ctx.fillRect(x, y, 2, 2);
        }

        // Draw player
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.shadowBlur = 0;

        // Draw bullets
        this.ctx.fillStyle = '#ffff00';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#ffff00';
        for (let bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        this.ctx.shadowBlur = 0;

        // Draw enemies
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#ff00ff';
        for (let enemy of this.enemies) {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        this.ctx.shadowBlur = 0;

        // Draw enemy bullets
        this.ctx.fillStyle = '#ff0000';
        for (let bullet of this.enemyBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }

    updateScore() {
        document.getElementById('invaders-score').textContent = this.score;
        document.getElementById('invaders-lives').textContent = this.lives;
    }

    gameOver() {
        this.stop();
        setTimeout(() => gameManager.endGame(), 500);
    }
}

// Initialize game manager
const gameManager = new GameManager();

