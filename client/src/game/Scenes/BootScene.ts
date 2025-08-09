import { Character } from "../Character.ts";

type AtlasConfigItem = { key: string; textureURL: string; atlasURL: string };

const atlasConfigRAW: [string, string, string][] = [
  ["mushi", "assets/Sprites/mushi.png", "assets/Sprites/mushi.json"],
];

const atlasConfig: AtlasConfigItem[] =
  atlasConfigRAW.map(([key, textureURL, atlasURL]) => ({
    key,
    textureURL,
    atlasURL,
  }));

const animConfigs: AnimConfig[] = [
  { animKey: "idle", atlasKey: "mushi", frameRate: 8 },
  { animKey: "run", atlasKey: "mushi", frameRate: 12 },
  // 其他动画
];

function loadAtlas(
  scene: Phaser.Scene,
  obj: AtlasConfigItem[],
) {
  const keyset: string[] = []
  obj.forEach((item) => {
    scene.load.atlas(item.key, item.textureURL, item.atlasURL);
    keyset.push(item.key)
  });
  return keyset
}

type AnimConfig = {
  animKey: string;    // 动画名称
  atlasKey: string;   // 图集 key，必须在 loadedAtalas 中
  frameRate: number;
};

function createAnimsBatch(
  scene: Phaser.Scene,
  loadedAtalas: string[],
  animConfigs: AnimConfig[],
) {
  const animsMap: Record<string, Phaser.Animations.Animation> = {};

  animConfigs.forEach(({ animKey, atlasKey, frameRate }) => {
    if (!loadedAtalas.includes(atlasKey)) {
      console.warn(`AtlasKey ${atlasKey} 未加载，跳过动画创建: ${animKey}`);
      return;
    }

    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNames(atlasKey),
      frameRate,
      repeat: -1,
    });

    const anim = scene.anims.get(animKey);
    if (anim) animsMap[animKey] = anim;
  });

  return animsMap;
}

export class BootScene extends Phaser.Scene {
  loadedAtalas: string[] = [];
  animsMap: Record<string, Phaser.Animations.Animation> = {};

  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("tileset", "assets/tiles.png");
    this.loadedAtalas = loadAtlas(this, atlasConfig);
    this.load.tilemapTiledJSON("map", "assets/tilesmap.json");
  }

  create() {
    this.animsMap = createAnimsBatch(this, this.loadedAtalas, animConfigs);
    const mushi = new Character(this, "mushi", "idle", this.animsMap);

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage("brick", "tileset");
    const layer = map.createLayer("layer 1", tiles!, 0, 0);

    layer?.setCollisionByExclusion([-1]);
    this.physics.add.collider(mushi, layer!);
  }
}
