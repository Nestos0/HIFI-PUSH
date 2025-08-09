// config/characterConfig.js
type AnimMap = Record<string, Phaser.Animations.Animation>;

export const PlayerConfig = {
  gravity: 980,
  speed: 200,
  jumpPower: -500,
  bodySize: { width: 28, height: 60 },
  bodyOffset: { x: 15, y: 11 }
};
// Character.ts
export class Character extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    atlasKey: string,
    animKey: string,   
    animsMap: AnimMap,
    x: number = 300,
    y: number = 300,
    frameRate: number = 9,
    scale: number = 2,
    gravityY: number = PlayerConfig.gravity,
    bodySize: { width: number; height: number } = PlayerConfig.bodySize,
    bodyOffset: { x: number; y: number } = PlayerConfig.bodyOffset 
  ) {
    super(scene, x, y, atlasKey);

    // 添加到场景和物理系统
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 缩放
    this.setScale(scale);

    // 重力
    this.setGravityY(gravityY);

    // 设置碰撞体积
    this.body!.setSize(bodySize.width, bodySize.height);
    this.body!.setOffset(bodyOffset.x, bodyOffset.y);

    // 如果动画不存在则创建
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNames(atlasKey),
        frameRate: frameRate,
        repeat: -1,
      });
    }

    // 播放动画
    if (animsMap[animKey]) {
      this.anims.play(animKey);
    }
  }
}

