export {Viewport, Constants, Block}
export type {State, blokProp, rotationDetails, Key, Event, LazySequence, Action, Tetromino, Coordinates}
 
// Constants
const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 500, // 500
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  MAX_SPEED: 50,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

/** Types */
type State = Readonly<{
  gameEnd: boolean;
  blocks: ReadonlyArray<blokProp>;
  final: ReadonlyArray<blokProp>;
  clearDelete: ReadonlyArray<blokProp>;
  clearAdjust: ReadonlyArray<blokProp>;
  blockRotation: rotationDetails;
  score: number;
  level: number;
  highscore: number;
  action?: Action;
  nextBlock: LazySequence<Tetromino>;
  rowsCleared: number;
  tickedAmount: number;
}>;

/** Block Properties (exclude height and width shared by all blocks) */
type blokProp = Readonly<{
  x: string;
  y: string;
  id: string;
  style: string;
  label: string;
}>;

type rotationDetails = Readonly<{
  degrees: number;
  className: Tetromino;
}>;

/** User input */
type Key = "KeyS" | "KeyA" | "KeyD" | "Enter" | "KeyW" | "KeyQ" | "Space";

type Event = "keydown" | "keyup" | "keypress";

type Coordinates = Readonly<{
  x: number;
  y: number;
}>;

interface LazySequence<T> {
  blokType: T;
  next(): LazySequence<T>;
}

interface Action {
  apply(s: State): State;
}

interface Tetromino {
  blocks: ReadonlyArray<blokProp>;
  rotation(
    initial: ReadonlyArray<blokProp>,
    final: ReadonlyArray<blokProp>,
    degrees: number,
    isClockWise: boolean
  ): Readonly<{ update: boolean; blocks: ReadonlyArray<blokProp> }>;
}



