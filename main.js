// main.js (Poki Ready)

let player;
let cursors;
let obstacles;
let gems;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gemCount = 0;
let scoreText;
let gemText;
let highScoreText;
let gameSpeed = 200;
let isGameOver = false;
let shopOpen = false;
let obstacleSpawnRate = 1000;
let shopPanel;
let shopTitle;
let shopOption;
let muteButton;
let isMuted = false;

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        PokiSDK.gameLoadingFinished();

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.add.text(centerX, centerY - 100, 'Endless Runner', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
        const startText = this.add.text(centerX, centerY, '▶ PLAY', { fontSize: '48px', fill: '#0f0' }).setOrigin(0.5).setInteractive();
        startText.on('pointerdown', () => {
            PokiSDK.gameplayStart();
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        score = 0;
        gemCount = 0;
        isGameOver = false;

        player = this.add.rectangle(100, 300, 40, 40, 0xffffff);
        this.physics.add.existing(player);
        player.body.setCollideWorldBounds(true);

        cursors = this.input.keyboard.createCursorKeys();

        obstacles = this.physics.add.group();
        gems = this.physics.add.group();

        scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#fff' });
        gemText = this.add.text(16, 48, 'Gems: 0', { fontSize: '24px', fill: '#fff' });
        highScoreText = this.add.text(16, 80, `High Score: ${highScore}`, { fontSize: '24px', fill: '#fff' });

        this.obstacleTimer = this.time.addEvent({ delay: obstacleSpawnRate, callback: this.spawnObstacle, callbackScope: this, loop: true });
        this.gemTimer = this.time.addEvent({ delay: 1500, callback: this.spawnGem, callbackScope: this, loop: true });

        this.physics.add.overlap(player, obstacles, this.gameOver, null, this);
        this.physics.add.overlap(player, gems, this.collectGem, null, this);

        const shopButton = this.add.text(this.scale.width - 100, 20, 'SHOP', { fontSize: '28px', fill: '#0ff' }).setInteractive();
        shopButton.on('pointerdown', () => {
            if (!shopOpen) this.openShop();
            else this.closeShop();
        });

        muteButton = this.add.text(this.scale.width - 100, 60, '🔊', { fontSize: '24px', fill: '#fff' }).setInteractive();
        muteButton.on('pointerdown', () => {
            isMuted = !isMuted;
            muteButton.setText(isMuted ? '🔇' : '🔊');
            // hier kun je geluid muten/unmuten als er audio is
        });
    }

    update() {
        if (isGameOver || shopOpen) return;

        if (cursors.up.isDown) {
            player.y -= 5;
        } else if (cursors.down.isDown) {
            player.y += 5;
        }

        obstacles.getChildren().forEach((obs) => {
            obs.x -= 4;
            if (obs.x < -50) {
                obs.destroy();
                score++;
                scoreText.setText('Score: ' + score);

                if (score % 20 === 0 && obstacleSpawnRate > 400) {
                    obstacleSpawnRate -= 100;
                    this.obstacleTimer.remove(false);
                    this.obstacleTimer = this.time.addEvent({ delay: obstacleSpawnRate, callback: this.spawnObstacle, callbackScope: this, loop: true });
                }
            }
        });

        gems.getChildren().forEach((gem) => {
            gem.x -= 4;
            if (gem.x < -50) gem.destroy();
        });
    }

    spawnObstacle() {
        const y = Phaser.Math.Between(50, 550);
        const obs = this.add.rectangle(800, y, 30, 60, 0xff0000);
        this.physics.add.existing(obs);
        obs.body.setImmovable(true);
        obstacles.add(obs);
    }

    spawnGem() {
        const y = Phaser.Math.Between(50, 550);
        const overlap = obstacles.getChildren().some(obs => Math.abs(obs.y - y) < 60);
        if (!overlap) {
            const gem = this.add.triangle(800, y, 0, 30, 15, 0, 30, 30, 0xffff00);
            this.physics.add.existing(gem);
            gems.add(gem);
        }
    }

    collectGem(player, gem) {
        gem.destroy();
        gemCount++;
        gemText.setText('Gems: ' + gemCount);
    }

    openShop() {
        shopPanel = this.add.rectangle(400, 300, 350, 400, 0x111111).setAlpha(0.95);
        shopTitle = this.add.text(400, 150, 'SHOP', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5);
        shopOption = this.add.text(400, 250, 'Skins & Upgrades (Coming soon)', { fontSize: '20px', fill: '#ccc' }).setOrigin(0.5);
        shopOpen = true;
    }

    closeShop() {
        if (shopPanel) shopPanel.destroy();
        if (shopTitle) shopTitle.destroy();
        if (shopOption) shopOption.destroy();
        shopOpen = false;
    }

    gameOver() {
        isGameOver = true;
        PokiSDK.gameplayStop();

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        const gameOverText = this.add.text(centerX, centerY - 50, 'Game Over', { fontSize: '48px', fill: '#ff0000' }).setOrigin(0.5);
        const restartText = this.add.text(centerX, centerY + 10, 'Click to Restart', { fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            gameOverText.destroy();
            restartText.destroy();
            this.scene.start('MenuScene');
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene]
};

PokiSDK.init().then(() => {
    PokiSDK.gameLoadingStart();
    new Phaser.Game(config);
});
