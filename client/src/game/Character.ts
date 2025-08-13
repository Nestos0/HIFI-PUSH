interface KeyBindings {
  [key: string]: Phaser.Input.Keyboard.Key;
}

type customData = {
  boxSize: { w: number; h: number };
  offset: { x: number; y: number };
};

export const PlayerConfig = {
  gravity: 2040,
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
  jumping: boolean = false;
  jumpTimer: number = 0;
  lastDirection: string = "";
  // cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  ACCELERATION = 4000; // 加速度常量
  MAX_VELOCITY = 400; // 最大速度常量
  currrentAnimName: string = "";

  constructor(
    scene: Phaser.Scene,
    characterKey: string,
    // cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    x: number = 300,
    y: number = 300,
    scale: number = 2,
    gravityY: number = PlayerConfig.gravity,
  ) {
    super(scene, x, y, `${characterKey}-idle`);
    this.characterKey = characterKey;

    this.setOrigin(0.5);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    const { dynamic } = this.setCharacter(characterKey);

    this.setGravityY(gravityY);

    this.setDragX(2097);

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

      this.setOffset(offsetX, 0);
    }

    this.setSize(frameWidth, frameHeight);
    return atlasTexture.customData as { dynamic: boolean };
  }

  update(keys: KeyBindings, time: number, delta: number) {
    const velocityX: number = this.body!.velocity.x;
    const { MAX_VELOCITY, ACCELERATION } = this;

    let input = {
      left: keys.left.isDown,
      right: keys.right.isDown,
      up: keys.up.isDown,
      down: keys.down.isDown,
    };


    const leftDown = input.left;
    const rightDown = input.right;
    let direction = 0;
    let playAnim = "idle";
    let flipX = this.flipX;
    const leapfrog = true ? !input.up : true;


    if (input.up && (!this.jumping || this.jumpTimer > 0)) {
      const vel = -200 * (this.jumpTimer / 300);
      this.setVelocityY(vel - 300).anims.stop();
    }
    if (this.body!.blocked.down && leapfrog) {
      this.jumpTimer = 300;
      this.jumping = false;
    }

    if (!this.body!.blocked.down) {
      this.jumping = true;
    }

    if (Phaser.Input.Keyboard.JustDown(keys.left)) {
      this.lastDirection = "left";
    } else if (Phaser.Input.Keyboard.JustDown(keys.right)) {
      this.lastDirection = "right";
    }

    if (leftDown) {
      direction = -1;
      playAnim = "run";
      flipX = true;
    } else if (rightDown) {
      direction = 1;
      playAnim = "run";
      flipX = false;
    }

    if (leftDown && rightDown && this.lastDirection) {
      direction = this.lastDirection === "left" ? -1 : 1;
      playAnim = "run";
      flipX = this.lastDirection === "left";
    }


    this.jump(delta);
    this.setAccelerationX(
      direction * ACCELERATION * (!this.body!.blocked.down ? 0.5 : 1),
    );
    this.setFlipX(flipX);
    if (this.currrentAnimName !== "playAnim") {
      this.playAnim(playAnim as PlayerAnim);
    }

    if (Math.abs(velocityX) > MAX_VELOCITY && velocityX !== 0) {
      this.setVelocityX(Math.sign(velocityX) * MAX_VELOCITY).setAccelerationX(
        0,
      );
    }

    if (!this.body!.blocked.down) {
      this.setDragX(20);
    } else {
      this.setDragX(2000);
    }
  }

  jump(delta: number) {
    if (!this.body?.blocked.down) {
      this.jumpTimer -= delta;
    }
  }

  playAnim(name: PlayerAnim, ignoreIfPlaying = true) {
    if (this.body?.blocked.down) {
      this.currrentAnimName = name;
      const animName = `${this.characterKey}-${PlayerAnims[name]}`;
      const atlasTexture = this.scene.textures.get(animName);
      const { boxSize } = atlasTexture.get().customData as customData;
      const frameHeight = boxSize.h;
      const frameWidth = boxSize.w;

      this.setSize(frameWidth, frameHeight);
      this.setOffset(boxSize.w / 2, 5);
      this.anims.play(
        `${this.characterKey}-${PlayerAnims[name]}-anim`,
        ignoreIfPlaying,
      );
    }
  }
}
