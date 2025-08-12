export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('background', 'assets/sky.png');
        this.load.spritesheet('player', 'assets/player.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.image('platform', 'assets/platform.png');
        this.load.image('enemy', 'assets/enemy.png');
    }

    create() {
        // 设置物理系统
        this.physics.world.setBounds(0, 0, 800, 600);
        
        // 创建背景和平台
        this.add.image(400, 300, 'background');
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();
        this.platforms.create(200, 450, 'platform');
        this.platforms.create(600, 400, 'platform');

        // 创建敌人
        this.enemies = this.physics.add.group();
        this.enemies.create(500, 350, 'enemy');
        this.enemies.create(300, 200, 'enemy');

        // 创建玩家角色
        this.createPlayer();

        // 设置碰撞检测
        this.setupCollisions();

        // 控制键设置
        this.cursors = this.input.keyboard.createCursorKeys();
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 调试显示
        this.debugGraphics = this.add.graphics();
        this.debugMode = true;
    }

    createPlayer() {
        // 主视觉表现
        this.player = this.add.sprite(100, 450, 'player');
        this.player.setOrigin(0.5, 1); // 底部中心为锚点

        // 主碰撞体 - 用于移动和站立
        this.player.mainBody = this.physics.add.body(this.player.x, this.player.y - 24, 32, 48);
        this.player.mainBody.setCollideWorldBounds(true);
        this.player.mainBody.setGravityY(300);

        // 拉伸碰撞体 - 用于攻击等变形状态
        this.player.stretchBody = this.physics.add.body(this.player.x, this.player.y - 24, 0, 0);
        this.player.stretchBody.enable = false;

        // 攻击判定碰撞体
        this.player.attackBody = this.physics.add.body(this.player.x, this.player.y - 24, 0, 0);
        this.player.attackBody.enable = false;

        // 玩家状态
        this.player.isAttacking = false;
        this.player.facingRight = true;
        this.player.stretchFactor = 0;

        // 动画
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'attack',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 15,
            repeat: 0
        });

        this.player.play('idle');
    }

    setupCollisions() {
        // 主碰撞体与环境碰撞
        this.physics.add.collider(this.player.mainBody, this.platforms);
        
        // 主碰撞体与敌人碰撞（受伤）
        this.physics.add.overlap(this.player.mainBody, this.enemies, (body1, body2) => {
            this.playerGotHit();
        });

        // 攻击碰撞体与敌人碰撞（攻击敌人）
        this.physics.add.overlap(this.player.attackBody, this.enemies, (body1, body2) => {
            body2.gameObject.destroy();
        });

        // 拉伸碰撞体与环境碰撞（可选）
        this.physics.add.collider(this.player.stretchBody, this.platforms);
    }

    update() {
        // 更新碰撞体位置跟随玩家视觉位置
        this.player.mainBody.x = this.player.x;
        this.player.mainBody.y = this.player.y - 24;
        
        this.player.stretchBody.x = this.player.x;
        this.player.stretchBody.y = this.player.y - 24;
        
        this.player.attackBody.x = this.player.x;
        this.player.attackBody.y = this.player.y - 24;

        // 处理输入
        this.handleInput();

        // 更新拉伸效果
        this.updateStretch();

        // 调试绘制
        if (this.debugMode) {
            this.drawDebug();
        }
    }

    handleInput() {
        if (this.player.isAttacking) return;

        // 左右移动
        if (this.cursors.left.isDown) {
            this.player.mainBody.setVelocityX(-160);
            this.player.setFlipX(true);
            this.player.facingRight = false;
            this.player.play('run', true);
        } else if (this.cursors.right.isDown) {
            this.player.mainBody.setVelocityX(160);
            this.player.setFlipX(false);
            this.player.facingRight = true;
            this.player.play('run', true);
        } else {
            this.player.mainBody.setVelocityX(0);
            this.player.play('idle', true);
        }

        // 跳跃
        if (this.cursors.up.isDown && this.player.mainBody.onFloor()) {
            this.player.mainBody.setVelocityY(-330);
        }

        // 攻击
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.playerAttack();
        }
    }

    playerAttack() {
        this.player.isAttacking = true;
        this.player.play('attack');
        
        // 启用攻击碰撞体
        this.player.attackBody.enable = true;
        this.player.attackBody.setSize(50, 30);
        this.player.attackBody.setOffset(this.player.facingRight ? 20 : -70, -10);
        
        // 启用拉伸碰撞体
        this.player.stretchFactor = 1.0;
        this.player.stretchBody.enable = true;
        this.player.stretchBody.setSize(60, 40);
        this.player.stretchBody.setOffset(this.player.facingRight ? 10 : -50, -5);

        // 攻击动画结束时重置
        this.player.once('animationcomplete', () => {
            this.player.isAttacking = false;
            this.player.attackBody.enable = false;
            this.player.stretchBody.enable = false;
            this.player.stretchFactor = 0;
        });
    }

    updateStretch() {
        if (this.player.isAttacking) {
            // 攻击时的拉伸效果
            const progress = this.player.anims.currentFrame.progress;
            this.player.stretchFactor = Phaser.Math.Easing.Sine.Out(progress);
            
            // 视觉拉伸
            this.player.scaleX = this.player.facingRight ? 
                1 + this.player.stretchFactor * 0.5 : 
                -1 - this.player.stretchFactor * 0.5;
        } else if (Math.abs(this.player.mainBody.velocity.x) > 150) {
            // 快速移动时的轻微拉伸
            this.player.stretchFactor = Phaser.Math.Clamp(
                this.player.stretchFactor + 0.05, 0, 0.2
            );
            this.player.scaleX = this.player.facingRight ? 
                1 + this.player.stretchFactor : 
                -1 - this.player.stretchFactor;
            this.player.scaleY = 1 - this.player.stretchFactor * 0.3;
        } else {
            // 恢复原状
            this.player.stretchFactor = Phaser.Math.Clamp(
                this.player.stretchFactor - 0.05, 0, 1
            );
            this.player.scaleX = this.player.facingRight ? 
                1 + this.player.stretchFactor : 
                -1 - this.player.stretchFactor;
            this.player.scaleY = 1 - this.player.stretchFactor * 0.3;
        }
    }

    playerGotHit() {
        // 受伤效果
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });
    }

    drawDebug() {
        this.debugGraphics.clear();
        
        // 绘制主碰撞体
        this.debugGraphics.lineStyle(2, 0x00ff00);
        this.debugGraphics.strokeRect(
            this.player.mainBody.x - this.player.mainBody.width / 2,
            this.player.mainBody.y - this.player.mainBody.height / 2,
            this.player.mainBody.width,
            this.player.mainBody.height
        );
        
        // 绘制拉伸碰撞体
        if (this.player.stretchBody.enable) {
            this.debugGraphics.lineStyle(2, 0xffff00);
            this.debugGraphics.strokeRect(
                this.player.stretchBody.x - this.player.stretchBody.width / 2,
                this.player.stretchBody.y - this.player.stretchBody.height / 2,
                this.player.stretchBody.width,
                this.player.stretchBody.height
            );
        }
        
        // 绘制攻击碰撞体
        if (this.player.attackBody.enable) {
            this.debugGraphics.lineStyle(2, 0xff0000);
            this.debugGraphics.strokeRect(
                this.player.attackBody.x - this.player.attackBody.width / 2,
                this.player.attackBody.y - this.player.attackBody.height / 2,
                this.player.attackBody.width,
                this.player.attackBody.height
            );
        }
    }
}
