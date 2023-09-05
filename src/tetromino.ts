export { tTetromino, oTetromino, iTetromino, jTetromino, lTetromino, sTetromino, zTetromino };

import { blokProp, Tetromino, Block, Coordinates } from "./types";
import { rotatePoint } from "./util";

/** Default Tetromino
 *   - Shares properties & methods with all tetrominoes except oTetromino & iTetromino 
 */
abstract class defTetro {
  blocks: ReadonlyArray<blokProp>;

  constructor(blocks: ReadonlyArray<blokProp> = []) {
    this.blocks = blocks;
  }

  // id1 blocks instantiated will always be the middle block (except o and i)
  static centreRotation(
    blocks: ReadonlyArray<blokProp>,
    degrees: number
  ): { x: number; y: number } {
    return blocks
      .filter((blok) => blok.id == "id1")
      .map((blok) => ({ x: +blok.x, y: +blok.y }))[0];
  }

  static rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    centreRotation: (
      blocks: ReadonlyArray<blokProp>,
      degrees: number
    ) => { x: number; y: number },
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }> {
    const rotPoint = centreRotation(initial, degrees);
    const rotatedList = initial.map((blok) => {
      const rotated = rotatePoint(
        +blok.x,
        +blok.y,
        rotPoint.x,
        rotPoint.y,
        isClockWise ? 90 : -90
      )
      return { ...blok, x: String(rotated.x), y: String(rotated.y) };
    });
    const isOutOfBounds = rotatedList
      .map((blok) =>
        +blok.x < 0 || +blok.x > 180 || +blok.y < 0 || +blok.y > 380
          ? true
          : false
      )
      .reduce((acc: boolean, bool: boolean) => acc || bool, false);
    const isColliding = rotatedList
      .map(
        (movingBlok) =>
          final.filter(
            (finalBlok) =>
              finalBlok.x == movingBlok.x && finalBlok.y == movingBlok.y
          ).length == 1
      )
      .reduce((acc: boolean, bool: boolean) => acc || bool, false);

    if (!isOutOfBounds && !isColliding) {
      return { update: true, blocks: rotatedList };
    } else {
      return { update: false, blocks: initial };
    }
  }
}

class tTetromino extends defTetro implements Tetromino {
  static initialState = [
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id1",
      style: "fill: purple",
      label: "id1",
    },
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id2",
      style: "fill: purple",
      label: "id2",
    },
    {
      x: `${Block.WIDTH * (4 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id3",
      style: "fill: purple",
      label: "id3",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id4",
      style: "fill: purple ",
      label: "id4",
    },
  ];
  constructor() {
    super(tTetromino.initialState);
  }

  rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }> {
    return defTetro.rotation(
      initial,
      final,
      degrees,
      defTetro.centreRotation,
      isClockWise
    );
  }
}

class oTetromino implements Tetromino {
  blocks: ReadonlyArray<blokProp>;
  static initialState = [
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id1",
      style: "fill: yellow",
      label: "id1",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id2",
      style: "fill: yellow",
      label: "id2",
    },
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id3",
      style: "fill: yellow",
      label: "id3",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id4",
      style: "fill: yellow",
      label: "id4",
    },
  ];
  constructor() {
    this.blocks = oTetromino.initialState;
  }

  /** Pointless placeholder for centreRotation & rotation
  *     - oTetromino doesn't rotate 
  *     - internal relative position of the four blocks to each other is unimportant
  */
  centreRotation(
    blocks: ReadonlyArray<blokProp>,
    degrees: number
  ): Coordinates {
    return { x: 0, y: 0 }; 
  }

  rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }> {
    return { update: true, blocks: initial };
  }
}

class iTetromino extends defTetro implements Tetromino {
  static initialState = [
    {
      x: `${Block.WIDTH * (4 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id1",
      style: "fill: cyan",
      label: "id1",
    },
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id2",
      style: "fill: cyan",
      label: "id2",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id3",
      style: "fill: cyan",
      label: "id3",
    },
    {
      x: `${Block.WIDTH * (7 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id4",
      style: "fill: cyan",
      label: "id4",
    },
  ];
  constructor() {
    super(iTetromino.initialState);
  }

  static centreRotation(
    blocks: ReadonlyArray<blokProp>,
    degrees: number
  ): Coordinates {
    const id2blok = blocks.filter((blok) => blok.id == "id2");

    return id2blok.map((id2blok) => {
      const centreX =
        degrees == 0 || degrees == 270
          ? +id2blok.x + Block.WIDTH / 2
          : +id2blok.x - Block.WIDTH / 2;
      const centreY =
        degrees == 0 || degrees == 90
          ? +id2blok.y + Block.HEIGHT / 2
          : +id2blok.y - Block.HEIGHT / 2;
      return { x: centreX, y: centreY };
    })[0];
  }

  rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }> {
    return defTetro.rotation(
      initial,
      final,
      degrees,
      iTetromino.centreRotation,
      isClockWise
    );
  }
}

class jTetromino extends defTetro implements Tetromino {
  static initialState = [
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id1",
      style: "fill: blue",
      label: "id1",
    },
    {
      x: `${Block.WIDTH * (4 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id2",
      style: "fill: blue",
      label: "id2",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id3",
      style: "fill: blue",
      label: "id3",
    },
    {
      x: `${Block.WIDTH * (4 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id4",
      style: "fill: blue",
      label: "id4",
    },
  ];
  constructor() {
    super(jTetromino.initialState);
  }

  rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }> {
    return defTetro.rotation(
      initial,
      final,
      degrees,
      defTetro.centreRotation,
      isClockWise
    );
  }
}

class lTetromino extends defTetro implements Tetromino {
  static initialState = [
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id1",
      style: "fill: orange",
      label: "id1",
    },
    {
      x: `${Block.WIDTH * (4 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id2",
      style: "fill: orange",
      label: "id2",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id3",
      style: "fill: orange",
      label: "id3",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id4",
      style: "fill: orange",
      label: "id4",
    },
  ];
  constructor() {
    super(lTetromino.initialState);
  }

  rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }> {
    return defTetro.rotation(
      initial,
      final,
      degrees,
      defTetro.centreRotation,
      isClockWise
    );
  }
}

class sTetromino extends defTetro implements Tetromino {
  static initialState = [
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id1",
      style: "fill: green",
      label: "id1",
    },
    {
      x: `${Block.WIDTH * (4 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id2",
      style: "fill: green",
      label: "id2",
    },
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id3",
      style: "fill: green",
      label: "id3",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id4",
      style: "fill: green",
      label: "id4",
    },
  ];
  constructor() {
    super(sTetromino.initialState);
  }

  rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }> {
    return defTetro.rotation(
      initial,
      final,
      degrees,
      defTetro.centreRotation,
      isClockWise
    );
  }
}

class zTetromino extends defTetro implements Tetromino {
  static initialState = [
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id1",
      style: "fill: red",
      label: "id1",
    },
    {
      x: `${Block.WIDTH * (4 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id2",
      style: "fill: red",
      label: "id2",
    },
    {
      x: `${Block.WIDTH * (5 - 1)}`,
      y: `${Block.HEIGHT * 0}`,
      id: "id3",
      style: "fill: red",
      label: "id3",
    },
    {
      x: `${Block.WIDTH * (6 - 1)}`,
      y: `${Block.HEIGHT * 1}`,
      id: "id4",
      style: "fill: red",
      label: "id4",
    },
  ];
  constructor() {
    super(zTetromino.initialState);
  }

  rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }> {
    return defTetro.rotation(
      initial,
      final,
      degrees,
      defTetro.centreRotation,
      isClockWise
    );
  }
}
