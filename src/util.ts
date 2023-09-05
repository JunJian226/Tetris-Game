export { rngBlocks, createSvgElement, noOfLargerNumber, isFinal, highestPoint, rotatePoint, uniqueList };

import { LazySequence, blokProp, Viewport, Coordinates, Tetromino } from "./types";
import { iTetromino, jTetromino, lTetromino, oTetromino, sTetromino, tTetromino, zTetromino } from "./tetromino.ts";

abstract class RNG {
  // LCG using mostly GCC's constants except for a more fitting m value (from testing)
  private static m = 7 ** 31; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  // Scales to [0,6]
  public static scale = (hash: number) => Math.floor(7 * (hash / (RNG.m - 1)));
}

function rngBlocks() {
  return function _nextBlock(s: number): LazySequence<Tetromino> {
    const blockOptions = [ iTetromino, jTetromino, lTetromino, oTetromino, sTetromino, tTetromino, zTetromino ];
    const hash = RNG.hash(s);

    // arg passed to _nextBlock is incremented to prevent consecutive patterns
    return {
      blokType: new blockOptions[RNG.scale(hash)](),
      next: () => _nextBlock(hash + 1),
    };
  };
}

/**®
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

const noOfLargerNumber = (n: string, l: Array<string>): number =>
  l.reduce((acc, no) => (+no > +n ? acc + 1 : acc), 0);

const isFinal = (blocks: ReadonlyArray<blokProp>): boolean =>
  blocks
    .map((ele) => ele.label)
    .reduce((acc, ele) => acc || ele.includes("final"), false);

// find smallest y value (highest on the canvas)
const highestPoint = (blocks: ReadonlyArray<blokProp>): number =>
  blocks.reduce(
    (acc: number, ele) => (+ele.y < acc ? +ele.y : acc),
    Viewport.CANVAS_HEIGHT
  );

/** Uses Mathematical 2D Rotation Transformation Formula */
const rotatePoint = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  angle: number
): Coordinates => {
  const radians = (angle * Math.PI) / 180,
    cosTheta = Math.cos(radians),
    sinTheta = Math.sin(radians),
    translatedX = x - cx,
    translatedY = y - cy,
    finalX = translatedX * cosTheta - translatedY * sinTheta + cx,
    finalY = translatedX * sinTheta + translatedY * cosTheta + cy;

  return { x: finalX, y: finalY };
};

const uniqueList =
  (axis: "x" | "y") =>
  (blockArray: ReadonlyArray<blokProp>): ReadonlyArray<string> => {
    return blockArray
      .map((block: blokProp) => block[axis])
      .reduce(
        (acc: Array<string>, ele: string) =>
          acc.includes(ele) ? acc : acc.concat(ele),
        []
      );
  };
