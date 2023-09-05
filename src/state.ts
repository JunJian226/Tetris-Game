export { initialState, updateState, Tick, Down, Right, Left, Restart, Rotate, HardDrop };

import { State, Action, blokProp, Viewport, Block, Constants } from "./types";
import { rngBlocks, highestPoint, isFinal, noOfLargerNumber, uniqueList } from "./util";

const updateState = (s: State, a: Action) => a.apply({ ...s, action: a });

// Impure code required to have random set of blocks each time, instead of same set
const initialRngBlock = rngBlocks()(new Date().getTime());

const initialState: State = {
  gameEnd: false,
  blocks: initialRngBlock.blokType.blocks,
  blockRotation: { degrees: 0, className: initialRngBlock.blokType },
  final: [],
  clearDelete: [],
  clearAdjust: [],
  score: 0,
  level: 1,
  highscore: 0,
  nextBlock: initialRngBlock.next(),
  rowsCleared: 0,
  tickedAmount: 0,
} as const;

const finalStateInitialise = (s: State): State => {
  /** Hit upper bound game end condition 
   *    - No block can spawn and be able to move before y = 20
   */
  if (highestPoint(s.blocks) <= 20) {
    return {
      ...s,
      gameEnd: true,
      final: s.final.map((block) => ({ ...block, id: block.label })),
      highscore: s.score > s.highscore ? s.score : s.highscore,
    };
    /** post final position reinitialisation */
  } else {
    const nextTetro = s.nextBlock.blokType;
    return {
      ...s,
      blocks: nextTetro.blocks,
      final: s.final.map((block) => ({ ...block, id: block.label })),  // update id to label (bc id of final block in canvas is set to label)
      clearDelete: [],
      clearAdjust: [],
      nextBlock: s.nextBlock.next(),
      blockRotation: { degrees: 0, className: nextTetro },
    };
  }
};

const reinitialisation = (s: State): { update: boolean; s: State } => {
  /**  Post game end restart reinitialisation */
  if (s.final.length == 0 && s.gameEnd) {
    const nextTetro = s.nextBlock.blokType;
    return {
      update: true,
      s: {
        ...s,
        gameEnd: false,
        blocks: nextTetro.blocks,
        blockRotation: { degrees: 0, className: nextTetro },
        clearDelete: [],
        score: 0,
        nextBlock: s.nextBlock.next(),
        level: 1,
        rowsCleared: 0,
        tickedAmount: 0,
      },
    };
  } else if (isFinal(s.blocks)) {
    return { update: true, s: finalStateInitialise(s) };
  } else {
    return { update: false, s: s };
  }
};

class DownwardsMovement {
  static apply = (s: State): State => {
    const data = reinitialisation(s);
    if (data.update) {
      return data.s;
    } else {
      const updatedBlocks = DownwardsMovement.moveDown(s.blocks, s.final);
      // Checks for any clearing of lines
      if (isFinal(updatedBlocks)) {
        return DownwardsMovement.lineClearing({
          ...s,
          blocks: updatedBlocks,
          final: s.final.concat(
            updatedBlocks.map((block) => ({ ...block, id: block.label }))
          ),
        });
      } else {
        return { ...s, blocks: updatedBlocks };
      }
    }
  };

  static moveDown(
    curr: ReadonlyArray<blokProp>,              // Current block (shortened var name to make code more readable)
    final: ReadonlyArray<blokProp>
  ): ReadonlyArray<blokProp> {
    const columnNo = uniqueList("x")(curr);
    const lowestBlockPerColumn = columnNo.map((column) => ({
        x: +column,
        y: curr
          .filter((block) => block.x == column)
          .reduce((acc, ele) => (+ele.y > acc ? +ele.y : acc), -1),
      }));
    const isColliding = lowestBlockPerColumn
        .map((coords) => {
          const blockCollision =
            final.filter(
              (block) =>
                +block.x == coords.x && +block.y == coords.y + Block.HEIGHT         // Check if there are any blocks underneath
            ).length >= 1;
          const floorCollision =
            coords.y >= Viewport.CANVAS_HEIGHT - Block.HEIGHT;
          return blockCollision || floorCollision;
        })
        .reduce((acc, bool) => acc || bool, false);

    if (!isColliding && !isFinal(curr)) {
      return curr.map((ele) => ({ ...ele, y: `${+ele.y + Block.HEIGHT}` }));
    } else {
      return curr.map((ele) => ({ ...ele, label: `final${ele.x},${ele.y}` }));
    }
  }

  static lineClearing(s: State): State {
    const { blocks, final } = s;
    const rowsAffected = blocks.reduce(
        (acc: Array<string>, ele) =>
          acc.includes(ele.y) ? acc : acc.concat(ele.y),
        []
      );
    const fullRows = rowsAffected
        .map((row) => ({
          y: row,
          isFull:
            final.filter((block) => block.y == row).length ==
            Constants.GRID_WIDTH
        }))
        .filter((data) => data.isFull)              // only includes full Rows
        .map((data) => data.y);                     

    if (fullRows.length > 0) {
      const blocksToDelete = final.filter((block) =>
        fullRows.includes(block.y)
      );
      const updatedFinal = final
          .filter((block) => !blocksToDelete.includes(block))
          .map((existBlock) => {
            const newY = `${ +existBlock.y + noOfLargerNumber(existBlock.y, fullRows) * Block.HEIGHT }`;
            return {
              ...existBlock,
              y: newY,
              label: `final${existBlock.x},${newY}`,
            };
          }),
        blocksToAdjust = updatedFinal.filter((ele) => ele.id !== ele.label);          // blocks yet to be adjusted also have not-adjusted IDs

      const updatedScore =
          s.score +
          fullRows.length * 100 +
          (fullRows.length - 1) * 100 +
          (fullRows.length == 4 ? 100 : 0),
        totalRowsCleared = s.rowsCleared + fullRows.length,
        newLevel = Math.floor(totalRowsCleared / 5) + 1;

      return {
        ...s,
        final: updatedFinal,
        clearDelete: blocksToDelete,
        clearAdjust: blocksToAdjust,
        score: updatedScore,
        highscore: updatedScore > s.highscore ? updatedScore : s.highscore,
        rowsCleared: totalRowsCleared,
        level: newLevel <= 10 ? newLevel : 10,
      };
    } else {
      return s;
    }
  }
}

class Tick extends DownwardsMovement implements Action {
  apply = (s: State): State => {
    if (
      s.tickedAmount >=
      Constants.TICK_RATE_MS / Constants.MAX_SPEED - s.level     // tick & block speed handler
    ) {
      return { ...DownwardsMovement.apply(s), tickedAmount: 0 };
    } else {
      return {
        ...s,
        tickedAmount: s.tickedAmount + 1,
      };
    }
  }
}

class Down extends DownwardsMovement implements Action {
  apply = (s: State): State => {
    return DownwardsMovement.apply(s);
  };
}

class Left implements Action {
  apply = (s: State): State => {
    const data = reinitialisation(s);
    if (data.update) {
      return data.s;
    } else {
      return { ...s, blocks: Left.moveLeft(s.blocks, s.final) };
    }
  };

  static moveLeft(
    curr: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>
  ): ReadonlyArray<blokProp> {
    const rowNo = uniqueList("y")(curr);
    const leftMostBlockPerRow = rowNo.map((row) => ({
      y: +row,
      x: curr
        .filter((block) => block.y == row)
        .reduce(
          (acc: number, ele) => (+ele.x < acc ? +ele.x : acc),
          Viewport.CANVAS_WIDTH
        ),
      }));
    const isColliding = leftMostBlockPerRow
      .map((coords) => {
        const blockCollision =
          final.filter(
            (block) =>
              +block.y == coords.y && +block.x == coords.x - Block.WIDTH    // check if there are any blocks on its left
          ).length >= 1;
        const wallCollision = coords.x <= 0;
        return blockCollision || wallCollision;
      })
      .reduce((acc, bool) => acc || bool, false);

    if (!isColliding && !isFinal(curr)) {
      return curr.map((ele) => ({ ...ele, x: `${+ele.x - Block.WIDTH}` }));
    } else {
      return curr;
    }
  }
}

class Right implements Action {
  apply = (s: State): State => {
    const data = reinitialisation(s);
    if (data.update) {
      return data.s;
    } else {
      return { ...s, blocks: Right.moveRight(s.blocks, s.final) };
    }
  };

  static moveRight(
    curr: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>
  ): ReadonlyArray<blokProp> {
    const rowNo = uniqueList("y")(curr);
    const rightMostBlockPerRow = rowNo.map((row) => ({
        y: +row,
        x: curr
          .filter((block) => block.y == row)
          .reduce((acc: number, ele) => (+ele.x > acc ? +ele.x : acc), -1),
      }));
    const isColliding = rightMostBlockPerRow
        .map((coords) => {
          const blockCollision =
            final.filter(
              (block) =>
                +block.y == coords.y && +block.x == coords.x + Block.WIDTH      // check if right side has got any blocks
            ).length >= 1;
          const wallCollision = coords.x >= Viewport.CANVAS_WIDTH - Block.WIDTH;
          return blockCollision || wallCollision;
        })
        .reduce((acc, bool) => acc || bool, false);

    if (!isColliding && !isFinal(curr)) {
      return curr.map((ele) => ({ ...ele, x: `${+ele.x + Block.WIDTH}` }));
    } else {
      return curr;
    }
  }
}

class Restart implements Action {
  apply = (s: State): State => {
    if (s.gameEnd) {
      return { ...s, final: [], clearDelete: s.final };
    } else {
      return s;
    }
  };
}

// Super Rotation System (SRS)
class Rotate implements Action {
  isClockWise: boolean;
  constructor(isClockWise: boolean) {
    this.isClockWise = isClockWise;
  }

  apply = (s: State): State => {
    // attempts blockRotation if not final position
    if (!isFinal(s.blocks)) {
      const blockType = s.blockRotation.className;
      const data = blockType.rotation(
        s.blocks,
        s.final,
        s.blockRotation.degrees,
        this.isClockWise
      );

      const newDegree = this.isClockWise
        ? (s.blockRotation.degrees + 90) % 360
        : s.blockRotation.degrees == 0          // Anticlockwise calculation - modulo360 does not handle negatives well
        ? 270
        : s.blockRotation.degrees - 90;

      return {
        ...s,
        blocks: data.update ? data.blocks : s.blocks,
        blockRotation: {
          ...s.blockRotation,
          degrees: data.update ? newDegree : s.blockRotation.degrees,
        }
      };
    } else {
      return finalStateInitialise(s);
    }
  };
}

class HardDrop implements Action {
  apply = (s: State): State => {
    if (!isFinal(s.blocks)) {
      const columnNo = uniqueList("x")(s.blocks)
      const blockPerColumn = columnNo.map((colNo) => ({         
        final: s.final.filter((blok) => blok.x === colNo),
        current: s.blocks.filter((blok) => blok.x === colNo),
      }));
      
      const highestNLowest = blockPerColumn.map((data) => {
        // finds highest existing block and lowest moving block of tetromino
        const lowestMoving = data.current.reduce(
          (acc: number, ele) => (+ele.y > acc ? +ele.y : acc), -1
        );
        const lowerFinalAndFloor = data.final
          .concat(                              // add pretend floor blocks to act as lower bound
            columnNo.map((xNo) => ({
              x: xNo,
              y: `${Viewport.CANVAS_HEIGHT}`,
              id: "",
              style: "",
              label: "",
            }))
          ) 
          .filter((block) => +block.y >= lowestMoving);
        return {
          final: highestPoint(lowerFinalAndFloor),
          current: lowestMoving,
        };
      });
      const changeInY = highestNLowest
        .map((data) => data.final - data.current)
        .filter((dY) => dY >= 0);
      const adjustedBlocks = changeInY.map((dY) =>
        s.blocks.map((blok: blokProp) => ({ ...blok, y: `${+blok.y + dY - 20}` }))      // -20 to be on the spot above existing Block
      );
      const nonColliding = adjustedBlocks.filter((blokArray) =>         // filter away drop position options that have collisions
        blokArray.reduce(
          (acc, blok) =>
            acc &&
            s.final.filter(
              (existBlok) => existBlok.x === blok.x && existBlok.y === blok.y
            ).length <= 0,
          true
        )
      );

      const highestAdjusted = nonColliding.reduce((acc, blokArray) =>  
        blokArray[0].y <= acc[0].y ? blokArray : acc
      );

      return { ...s, blocks: highestAdjusted };
    } else {
      return finalStateInitialise(s);
    }
  };
}
