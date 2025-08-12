type AnimMap = Record<string, Phaser.Animations.Animation>;

type customData = {
  boxSize: { w: number; h: number };
  offset: { x: number; y: number };
};

export const PlayerConfig = {
  gravity: 2940,
  speed: 200,
  jumpPower: -500,
  bodySize: { width: 28, height: 60 },
  bodyOffset: { x: 15, y: 11 },
};

const PlayerAnims = {
  idle: "idle",
  run: "run",
  hurt: "hurt",
  attack: "attack",
} as const;

type PlayerAnim = keyof typeof PlayerAnims;

export class Character extends Phaser.Physics.Arcade.Sprite {
  // stretchBody: Phaser.Physics.Arcade.Body;
  mainBody?: Phaser.Physics.Arcade.Body;
  characterKey: string;

  constructor(
    scene: Phaser.Scene,
    characterKey: string,
    x: number = 300,
    y: number = 400,
    scale: number = 2,
    gravityY: number = PlayerConfig.gravity,
  ) {
    super(scene, x, y, `${characterKey}-idle`);
    this.characterKey = characterKey;

    this.setOrigin(0.5, 1);

    // this.mainBody = scene.physics.add.body(this.x - 20, this.y - 50, 70, 112);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    // this.setSize(frameWidth, frameHeight);
    // this.setOffset(offsetX, height - frameHeight + offset.y);
    const { dynamic } = this.setCharacter(characterKey);

    this.setGravityY(gravityY);
    this.setCollideWorldBounds(true);

    this.setScale(scale);

    this.anims.play(`${characterKey}-idle-anim`);
    if (dynamic) {
      this.on(
        "animationupdate",
        (
          _: Phaser.Animations.Animation,
          frame: Phaser.Animations.AnimationFrame,
        ) => {
          const { height, realWidth } = frame.frame;
          const customData = frame.frame.customData as customData;
          const frameWidth = customData.boxSize.w;
          const frameHeight = customData.boxSize.h;

          const { offset } = customData;
          let offsetX = -offset.x;
          if (!this.flipX) {
            offsetX = realWidth - frameWidth + offset.x;
          }
          this.setSize(frameWidth, frameHeight);
          this.setOffset(offsetX, height - frameHeight + offset.y);
        },
      );
    }
  }

  playAnim(name: PlayerAnim, ignoreIfPlaying = true) {
    const x: number = this.x;
    const y: number = this.y;
    const atlasTexture = this.scene.textures.get(
      `${this.characterKey}-${PlayerAnims[name]}`,
    );
    const { boxSize } = atlasTexture.get().customData as customData;
    const frameHeight = boxSize.h;
    const frameWidth = boxSize.w;

    this.setSize(frameWidth, frameHeight);
    this.anims.play(
      `${this.characterKey}-${PlayerAnims[name]}-anim`,
      ignoreIfPlaying,
    );
    this.setPosition(x, y);
  }

  setCharacter(characterKey: string) {
    const atlasTexture = this.scene.textures.get(`${characterKey}-idle`);
    const { height, realWidth } = atlasTexture.get();
    const { boxSize, offset } = atlasTexture.get().customData as customData;
    const frameHeight = boxSize.h;
    const frameWidth = boxSize.w;

    if (offset) {
      let offsetX = 0;
      offsetX = -offset.x;
      if (!this.flipX) {
        offsetX = realWidth - frameWidth + offset.x;
      }

      this.setOffset(offsetX, height - frameHeight + offset.y);
    }

    this.setSize(frameWidth, frameHeight);
    return atlasTexture.customData as { dynamic: boolean };
  }
}
