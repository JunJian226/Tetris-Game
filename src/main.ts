/**
 * File contains main game logic and view-related rendering function
 */
import "./style.css";
import { Viewport, Constants, State, Block, Key } from "./types";
import { fromEvent, interval, merge, startWith, throttleTime, takeUntil } from "rxjs";
import { map, filter, scan, mergeMap } from "rxjs/operators";
import { Left, Right, Down, Tick, Restart, Rotate, HardDrop, updateState, initialState } from "./state";
import { createSvgElement, isFinal } from "./util.ts";

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */
  const key$ = fromEvent<KeyboardEvent>(document, "keydown");

  const fromKey = (keyCode: Key) =>
    key$.pipe(
      filter(({ code }) => code === keyCode),
      filter(({ repeat }) => !repeat)
    );

  /** "Creates" an observable stream for each keydown until keyup */
  const allowRepeatingInputs = mergeMap((d: KeyboardEvent) =>
    interval(50).pipe(
      takeUntil(
        fromEvent<KeyboardEvent>(document, "keyup").pipe(
          filter(({ code }) => code === d.code)
        )
      )
    )
  );

  const left$ = fromKey("KeyA").pipe(
    allowRepeatingInputs,
    map(_ => new Left())
  );
  const right$ = fromKey("KeyD").pipe(
    allowRepeatingInputs,
    map(_ => new Right())
  );
  // Throttle decreasing speed of consecutive inputs
  const down$ = fromKey("KeyS").pipe(
    allowRepeatingInputs,
    throttleTime(30),
    map(_ => new Down())
  );
  const enter$ = fromKey("Enter").pipe(map(_ => new Restart()));
  const anticwRotate$ = fromKey("KeyQ").pipe(map(_ => new Rotate(false)));
  const cwRotate$ = fromKey("KeyW").pipe(map(_ => new Rotate(true)));
  const hardDrop$ = fromKey("Space").pipe(map(_ => new HardDrop()));

  // Determines the rate of time steps 
  const tick$ = interval(Constants.MAX_SPEED).pipe(map(_ => new Tick()));

  /**
   * Renders the current state to the canvas.
   * In MVC terms, this updates the View using the Model.
   * 
   * @param s Current state
   */
  const render = (s: State) => {
    // block1 used as representative of entire tetromino 
    const block1 = document.getElementById("id1");

    //  Rendering new block onto screen 
    if (!block1 && !s.gameEnd) {
      s.blocks.map((prop) =>
        svg.appendChild(
          createSvgElement(svg.namespaceURI, "rect", {
            ...prop,
            height: `${Block.HEIGHT}`,
            width: `${Block.WIDTH}`,
            x: "0",
            y: "0",
            transform: `translate(${prop.x},${prop.y})`,
          })
        )
      );

      s.nextBlock.blokType.blocks.map((prop) =>
        preview.appendChild(
          createSvgElement(svg.namespaceURI, "rect", {
            ...prop,
            height: `${Block.HEIGHT}`,
            width: `${Block.WIDTH}`,
            x: `${+prop.x - 2 * Block.WIDTH}`,
            y: `${+prop.y + Block.HEIGHT}`,
            id: `preview${prop.id}`,
          })
        )
      );
    } else {
      // Post final position adjustments and deletion
      if (isFinal(s.blocks)) {
        // Change on-screen ID to desired final ID
        s.blocks.map((prop) =>
          document.getElementById(prop.id)?.setAttribute("id", prop.label)
        );

        s.clearDelete.map((prop) => {
          const svgBlock = document.getElementById(prop.id);
          svgBlock ? svg.removeChild(svgBlock) : null;
        });

        s.clearAdjust
          .map((prop) => ({
            prop: prop,
            block: document.getElementById(prop.id),
          }))
          .map((ele) => {
            ele.block?.setAttribute(
              "transform", `translate(${ele.prop.x},${ele.prop.y})`
            );
            ele.block?.setAttribute("id", ele.prop.label);
          });

        s.blocks.map((prop) => {
          const previewBlock = document.getElementById(`preview${prop.id}`);
          previewBlock ? preview.removeChild(previewBlock) : null;
        });

      // Moving existing block
      } else {
        s.blocks
          .map((prop) => ({
            prop: prop,
            block: document.getElementById(prop.id),
          }))
          .map((ele) =>
            ele.block?.setAttribute(
              "transform",
              `translate(${ele.prop.x},${ele.prop.y})`
            )
          );
      }
    }
  };

  const source$ = merge(
    tick$,
    left$,
    right$,
    down$,
    enter$,
    cwRotate$,
    anticwRotate$,
    hardDrop$
  )
    .pipe(
      scan(updateState, initialState),

      // Filters out Restart and Tick when not needed
      filter((s: State) => {
        if (s.action instanceof Restart) {
          return s.gameEnd ? true : false;
        } else if (s.action instanceof Tick && s.tickedAmount != 0) {
          return false;
        } else {
          return true;
        }
      }),
      startWith(initialState)
    )
    .subscribe((s: State) => {
      render(s);

      scoreText.innerHTML = `${s.score}`;
      levelText.innerHTML = `${s.level}`;
      highScoreText.innerHTML = `${s.highscore}`;

      if (s.gameEnd) {
        show(gameover);
      } else {
        hide(gameover);
      }
    });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
