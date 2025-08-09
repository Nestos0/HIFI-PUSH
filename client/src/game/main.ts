import { AUTO, Game } from "phaser";
import { BootScene } from "./Scenes/BootScene.ts";

const height = 450;
const width = 800;

const config = {
  type: AUTO,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.FIT,
    width: width,
    height: height,
  },
  input: {
    keyboard: true, // ✅ Explicitly enable keyboard input
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  backgroundColor: "#2c2c88",
  scene: [BootScene],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
