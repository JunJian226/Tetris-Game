/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";
import { Viewport, Constants, State, Block, Key} from "./types";
import { fromEvent, interval, merge, startWith, throttleTime } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import { Left, Right, Down, Tick, Restart, Rotate, updateState, initialState } from "./state";
import { createSvgElement, isFinal} from "./util.ts"

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
// const tick = (s: State) => s;

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
  const container = document.querySelector("#main") as HTMLElement; 

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
    key$.pipe(filter(({ code }) => code === keyCode));

  const left$ = fromKey("KeyA").pipe(map(_=> new Left())); 
  const right$ = fromKey("KeyD").pipe(map(_=> new Right()));
  const down$ = fromKey("KeyS").pipe(throttleTime(25),map(_=> new Down()));
  const enter$ = fromKey("Enter").pipe(throttleTime(50),map(_=> new Restart()));
  const anticwRotate$ = fromKey("KeyQ").pipe(map(_=> new Rotate(false)));
  const cwRotate$ = fromKey("KeyW").pipe(map(_=> new Rotate(true)));
  /** Observables */

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.MAX_SPEED).pipe(map(_ => new Tick())); 

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {

    /** block1 used as representative of entire tetromino */
    const block1 = document.getElementById("id1");
    
    // New block rendering onto screen
    if (!block1 && !s.gameEnd){
      s.blocks.map( (prop) => svg.appendChild(createSvgElement(svg.namespaceURI, "rect", 
        {...prop,
          height: `${Block.HEIGHT}`,
          width: `${Block.WIDTH}`,
          x: "0",
          y: "0",
          transform: `translate(${prop.x},${prop.y})`
        })) )

      s.nextBlock.value.blocks.map( (prop) => preview.appendChild(createSvgElement(svg.namespaceURI, "rect",
        { ...prop,
          height: `${Block.HEIGHT}`,
          width: `${Block.WIDTH}`,
          x: `${+prop.x-2*Block.WIDTH}`,
          y: `${+prop.y+Block.HEIGHT}`,
          id: `preview${prop.id}`
        })) )
    } else {
      // Post final position adjustments and deletion
      if (isFinal(s.blocks)){
        
        // Change on svg id to the desired final id
        s.blocks.map( (prop) => document.getElementById(prop.id)?.setAttribute("id",prop.label))

        s.clearDelete.map( (prop) => { 
          const svgBlock = document.getElementById(prop.id)
          svgBlock?svg.removeChild(svgBlock):null 
        })
        
        s.clearAdjust.map( (prop) => ({prop: prop, block: document.getElementById(prop.id)}))
                     .map( (ele) => { ele.block?.setAttribute("transform",`translate(${ele.prop.x},${ele.prop.y})`);
                                      ele.block?.setAttribute("id", ele.prop.label) })

        s.blocks.map( (prop) => {
          const previewBlock = document.getElementById(`preview${prop.id}`)
          previewBlock?preview.removeChild(previewBlock):null 
        })
      
      // Moving existing block
      } else {
        s.blocks.map( (prop) => ({prop: prop, block: document.getElementById(prop.id)}) )
                .map( (ele) => ele.block?.setAttribute("transform",`translate(${ele.prop.x},${ele.prop.y})`))
      }
    }
  }

  const source$ = merge(tick$,left$,right$,down$,enter$,cwRotate$, anticwRotate$)
    .pipe(
      
      scan(updateState, initialState),
  
      filter( (s: State) => { 
        if (s.action instanceof Restart){
          return (s.gameEnd)?true:false
        } else if (s.action instanceof Tick && s.tickedAmount != 0){
          return false
        } else {
          return true
        }
      }),
      startWith(initialState),
    ).subscribe((s: State) => {
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
