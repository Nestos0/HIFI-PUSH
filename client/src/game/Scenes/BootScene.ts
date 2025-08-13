import { Character } from "../Character.ts";
import jsonAnims from "../AnimConfig/test.json" with { type: "json" };

const characterAnims = jsonAnims.character;

interface KeyBindings {
  [key: string]: Phaser.Input.Keyboard.Key;
}

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
  accelerationX: number;
  lastDirection: string = "";
  platforms?: Phaser.Physics.Arcade.StaticGroup;
  keys: KeyBindings = {};
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
    // create 里加一行
    this.animsMap = createAnimsBatch(this, animConfigs);
    this.mushi = new Character(this, "mushi");
    // mushi.playAnim('run')

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage("brick", "tileset");
    const layer = map.createLayer("layer 1", tiles!, 0, 0);

    layer?.setCollisionByExclusion([-1]);
    layer?.setCollisionByProperty({ collides: true });

    this.physics.add.collider(this.mushi, layer!);
    this.cameras.main.startFollow(this.mushi);

    this.input.keyboard?.createCursorKeys();

    this.keys = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
    };
  }

  update(time: number, delta: number) {
    const { mushi, cursors } = this;

    mushi.update(this.keys, time, delta);
  }
}
