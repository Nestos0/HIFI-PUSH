import { Character } from "../Character.ts";
import jsonAnims from "../AnimConfig/test.json" with { type: "json" };

const characterAnims = jsonAnims.character;

type CharacterAnims = {
  animKey: string;
  spriteKey: string;
  frameRate: number;
  TextureURL: string | undefined;
  AtlasURL?: string;
  frameSet?: { frameWidth: number; frameHeight: number } | undefined;
  customFrameData?: Record<string, { width: number; height: number }>;
};

type JsonCharacters = {
  [character: string]: {
    [animsKey: string]: {
      TextureURL: string;
      frameRate: number;
      AtlasURL?: string;
      frameSet?: { frameWidth: number; frameHeight: number };
      customFrameData?: Record<string, { width: number; height: number }>;
    };
  };
};

function convertCharacterAnims(data: JsonCharacters): CharacterAnims[] {
  const result: CharacterAnims[] = [];

  for (const characterKey in data) {
    const anims = data[characterKey];
    for (const animKey in anims) {
      const { frameSet, AtlasURL, TextureURL, frameRate, customFrameData } =
        anims[animKey];
      result.push({
        animKey: `${characterKey}-${animKey}-anim`,
        spriteKey: `${characterKey}-${animKey}`,
        frameRate,
        TextureURL,
        frameSet,
        AtlasURL,
        customFrameData,
      });
    }
  }

  return result;
}

function loadSpriteSheet(scene: Phaser.Scene, obj: CharacterAnims[]) {
  const keyset: string[] = [];
  obj.forEach((item) => {
    if (item.AtlasURL) {
      scene.load.atlas(item.spriteKey, item.TextureURL, item.AtlasURL);
      keyset.push(item.spriteKey);
    } else {
      scene.load.spritesheet(item.spriteKey, item.TextureURL, item.frameSet);
      keyset.push(item.spriteKey);
    }
  });
  return keyset;
}

function createAnimsBatch(scene: Phaser.Scene, animConfigs: CharacterAnims[]) {
  const animsMap: Record<string, Phaser.Animations.Animation> = {};

  animConfigs.forEach(({ animKey, spriteKey: spriteKey, frameRate }) => {
    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNames(spriteKey),
      frameRate,
      repeat: -1,
    });

    const anim = scene.anims.get(animKey);
    if (anim) animsMap[animKey] = anim;
  });

  return animsMap;
}

const animConfigs = convertCharacterAnims(characterAnims);

export class BootScene extends Phaser.Scene {
  animConfigs: CharacterAnims[] = [];
  loadedAtalas: string[] = [];
  animsMap: Record<string, Phaser.Animations.Animation> = {};
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  mushi!: Character;
  ACCELERATION = 4000; // 加速度常量
  MAX_VELOCITY = 400; // 最大速度常量
  accelerationX: number;
  lastDirection: string = "";

  constructor() {
    super("BootScene");
    this.accelerationX = 0;
  }

  preload() {
    this.load.image("tileset", "assets/tiles.png");
    this.loadedAtalas = loadSpriteSheet(this, animConfigs);
    this.load.tilemapTiledJSON("map", "assets/tilesmap.json");
  }

  create() {
    this.animsMap = createAnimsBatch(this, animConfigs);
    this.mushi = new Character(this, "mushi");
    // mushi.playAnim('run')

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage("brick", "tileset");
    const layer = map.createLayer("layer 1", tiles!, 0, 0);

    layer?.setCollisionByExclusion([-1]);
    this.physics.add.collider(this.mushi, layer!);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.createCursorKeys();
    this.mushi.setDragX(2000);
  }

  update() {
    const { mushi, cursors, ACCELERATION, MAX_VELOCITY } = this;
    // console.log(mushi.body!.touching.up)

    if (cursors.up.isDown && mushi.body!.touching.down) {
      mushi.setVelocityY(-800).anims.stop();
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
      this.lastDirection = "left";
    } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
      this.lastDirection = "right";
    }

    const leftDown = cursors.left.isDown;
    const rightDown = cursors.right.isDown;
    let direction = 0;
    let playAnim = "idle";
    let flipX = mushi.flipX;

    if (leftDown && !rightDown) {
      direction = -1;
      playAnim = "run";
      flipX = true;
    } else if (rightDown && !leftDown) {
      direction = 1;
      playAnim = "run";
      flipX = false;
    } else if (leftDown && rightDown && this.lastDirection) {
      // 同时按下时，使用最后按下的方向
      direction = this.lastDirection === "left" ? -1 : 1;
      playAnim = "run";
      flipX = this.lastDirection === "left";
    }

    mushi.setAccelerationX(direction * ACCELERATION);

    const velocityX = mushi.body!.velocity.x;
    const velocityY = mushi.body!.velocity.y;
    if (Math.abs(velocityX) > MAX_VELOCITY && velocityX !== 0) {
      mushi
        .setVelocityX(Math.sign(velocityX) * MAX_VELOCITY)
        .setAccelerationX(0);
    } else if (Math.abs(velocityY) > MAX_VELOCITY && velocityY !== 0) {
      mushi
        .setVelocityY(Math.sign(velocityY) * MAX_VELOCITY)
        .setAccelerationY(0);

    }

    if (mushi.anims.currentAnim?.key !== playAnim) {
      mushi.playAnim(playAnim as "idle" | "run" | "attack" | "hurt");
    }
    if (mushi.flipX !== flipX) {
      mushi.setFlipX(flipX);
    }
  }
}
