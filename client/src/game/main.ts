import { AUTO, Game } from "phaser";
const height = 900;
const width = 1600;

const config = {
  type: AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: width,
    height: height
  },
  backgroundColor: "#2c2c88",
  secne: []
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
