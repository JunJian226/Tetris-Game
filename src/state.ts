export {initialState, updateState, Tick, Down, Right, Left, Restart, Rotate}

import {State, Action, blokProp, Viewport, Block, Constants} from "./types";
import {rngBlocks, highestPoint, isFinal, noOfLargerNumber} from "./util";

const updateState = (s: State, a: Action) => a.apply({...s, action: a});

const initialRngBlock = rngBlocks()(new Date().getTime());
const initialState: State = {
  gameEnd: false,
  blocks: initialRngBlock.value.blocks,
  blockRotation: {degrees: 0, className: initialRngBlock.value},
  // blockRotation: {degrees: 0, rotate: initialRngBlock.value.rotation},
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

const reinitialisation = (s: State): {update: boolean, s:State} =>{
    /**  post game End deletion reinitialisation */
    if (s.final.length == 0 && s.gameEnd){
        const nextTetro = s.nextBlock.value
        return { update: true, s:{
            ...s,
            gameEnd: false,
            blocks: nextTetro.blocks,
            blockRotation: { degrees: 0, className: nextTetro},
            clearDelete: [],
            score: 0,
            nextBlock: s.nextBlock.next(),
            
            level: 1,
            rowsCleared: 0,
            tickedAmount: 0,
        }}
    } else if (isFinal(s.blocks)){
      /** hit upper bound game end condition */ 
        if (highestPoint(s.blocks) <= 20){
            return {update: true, s:{ ...s,
                gameEnd: true,
                final: s.final.map( (block) => ({...block, id: block.label})),
                highscore: (s.score>s.highscore)?s.score:s.highscore,
            }}
      /** post final position reinitialisation */
        } else {
            const nextTetro = s.nextBlock.value
            return {update: true, s:{ ...s, 
                blocks: nextTetro.blocks,
                final: s.final.map( (block) => ({...block, id: block.label})), // update id to label
                clearDelete: [],
                clearAdjust: [],
                nextBlock: s.nextBlock.next(),
                blockRotation: { degrees: 0, className: nextTetro}
            }}}
    } else {
      return {update: false, s:s}
    }
}

class DownwardsMovement{
    static apply = (s: State): State => {
        const data = reinitialisation(s);
        if (data.update){
            return data.s
        } else{
            const updatedBlocks = DownwardsMovement.moveDown(s.blocks, s.final)
            if (isFinal(updatedBlocks)){
            return DownwardsMovement.lineClearing({ ...s,
                blocks: updatedBlocks,
                final: s.final.concat(updatedBlocks.map( (block) => ({...block, id: block.label}))),
            })
            } else{
                return { ...s, blocks: updatedBlocks}
            }
        } 
    }
  
    static moveDown(rec: ReadonlyArray<blokProp>, final: ReadonlyArray<blokProp>): ReadonlyArray<blokProp>{
        const 
            columnNo = rec.map( (block)=> block.x).reduce( (acc: Array<string>,ele: string)=> acc.includes(ele)?acc:acc.concat(ele),[]),
            lowestBlockPerColumn = columnNo.map( (column) => ({x: +column, y:
                rec.filter( (block) => block.x == column)
                    .reduce( (acc,ele) => (+ele.y>acc)?+ele.y:acc,-1) }) ),
            isColliding = lowestBlockPerColumn.map( (coords) => { 
                const blockCollision = final
                    .filter( (block)=> (+block.x == coords.x && +block.y == coords.y + Block.HEIGHT)).length >= 1
                const floorCollision = (coords.y >= Viewport.CANVAS_HEIGHT - Block.HEIGHT)
                return blockCollision || floorCollision
            }).reduce( (acc,bool) => acc || bool, false)
        
        if (!isColliding && !isFinal(rec)){
            return rec.map((ele)=> ({...ele, y: String(+ele.y + Block.HEIGHT)}) )
        } else {
            return rec.map((ele) => ({...ele, label: `final${ele.x},${ele.y}`}))
        }
    }
  
    static lineClearing(s: State): State{
        const
            { blocks, final } = s,
            rowsAffected = blocks.reduce( (acc: Array<string>,ele)=> (acc.includes(ele.y))?acc:acc.concat(ele.y),[]),
            fullRows = rowsAffected.map( (row) => ({
                y: row,
                isFull: final.filter( (block) => block.y == row).length == Constants.GRID_WIDTH,
            }))
                .filter( (data) => data.isFull )    // only includes full Rows
                .map( (data) => data.y)             // make only row number
      
        if (fullRows.length > 0){
            const 
                blocksToDelete = final.filter( (block) => fullRows.includes(block.y)),
                updatedFinal = final.filter((block) => !blocksToDelete.includes(block))
                    .map( (existBlock) => {
                        const newY = `${+existBlock.y + noOfLargerNumber(existBlock.y,fullRows)*Block.HEIGHT}`
                        return {...existBlock,
                            y: newY,
                            label: `final${existBlock.x},${newY}`,
                        }}),
                blocksToAdjust = updatedFinal.filter( (ele) => ele.id !== ele.label)
  
            const 
                updatedScore = s.score + fullRows.length*100 + (fullRows.length-1)*100 + ((fullRows.length==4)?100:0),
                totalRowsCleared = s.rowsCleared + fullRows.length,
                newLevel = Math.floor(totalRowsCleared/5) + 1

            return { ...s,
                final: updatedFinal,
                clearDelete: blocksToDelete,
                clearAdjust: blocksToAdjust,
                score: updatedScore,
                highscore: (updatedScore>s.highscore)?updatedScore:s.highscore,
                rowsCleared: totalRowsCleared,
                level: (newLevel <= 10)?newLevel: 10
            }
        }else{
            return s
        }
    }
}

class Tick extends DownwardsMovement implements Action{
    apply = (s:State): State => { 
        if (s.tickedAmount >= (Constants.TICK_RATE_MS/Constants.MAX_SPEED - s.level )){
            return { ...DownwardsMovement.apply(s),
                tickedAmount: 0,
            }
        } else{
            return {
                ...s,
                tickedAmount: s.tickedAmount + 1
            }
        }
    }
}
  
class Down extends DownwardsMovement implements Action{
    apply = (s:State): State => {
        return DownwardsMovement.apply(s)
    }
}
  
class Left implements Action{
    apply = (s:State): State => {
        const data = reinitialisation(s);
        if (data.update){
            return data.s
        } else {
            return { ...s,
                blocks: Left.moveLeft(s.blocks, s.final),            
            }
        }
    }
  
    static moveLeft(rec: ReadonlyArray<blokProp>, final: ReadonlyArray<blokProp>): ReadonlyArray<blokProp>{
        const 
            rowNo = rec.map( (block)=> block.y).reduce( (acc: Array<string>,ele: string)=> acc.includes(ele)?acc:acc.concat(ele),[]),
            leftMostBlockPerRow = rowNo.map( (row) => ({y: +row, x:
                rec.filter( (block) => block.y == row)
                    .reduce( (acc: number,ele) => (+ele.x<acc)?+ele.x:acc, Viewport.CANVAS_WIDTH) }) ),
            isColliding = leftMostBlockPerRow.map( (coords) => { 
                const blockCollision = final
                    .filter( (block)=> (+block.y == coords.y && +block.x == coords.x - Block.WIDTH)).length >= 1
                const wallCollision = (coords.x <= 0)
                return blockCollision || wallCollision
            })
                .reduce( (acc,bool) => acc || bool, false)
    
        if (!isColliding && !isFinal(rec)){
            return rec.map((ele)=> ({...ele, x: String(+ele.x - Block.WIDTH)}))
        } else{
            return rec
        }
    }
}
  
class Right implements Action{
    apply = (s:State): State => {
        const data = reinitialisation(s);
        if (data.update){
            return data.s
        } else{
            return { ...s,
                blocks: Right.moveRight(s.blocks, s.final),
            }
        }
    }
  
    static moveRight(rec: ReadonlyArray<blokProp>, final: ReadonlyArray<blokProp>): ReadonlyArray<blokProp>{
        const 
            rowNo = rec.map( (block)=> block.y).reduce( (acc: Array<string>,ele: string)=> acc.includes(ele)?acc:acc.concat(ele),[]),
            rightMostBlockPerRow = rowNo.map( (row) => ({y: +row, x:
            rec.filter( (block) => block.y == row)
                .reduce( (acc: number,ele) => (+ele.x>acc)?+ele.x:acc,-1) }) ),
            isColliding = rightMostBlockPerRow.map( (coords) => { 
                const blockCollision = final
                    .filter( (block)=> (+block.y == coords.y && +block.x == coords.x + Block.WIDTH)).length >= 1
                const wallCollision = (coords.x >= Viewport.CANVAS_WIDTH - Block.WIDTH)
                return blockCollision || wallCollision
            })
                .reduce( (acc,bool) => acc || bool, false)
  
        if (!isColliding && !isFinal(rec)){
            return rec.map((ele)=> ({...ele, x: String(+ele.x + Block.WIDTH)}))
        } else{
            return rec
        }
    }
}

class Restart implements Action{
    apply = (s: State): State => {
        if (s.gameEnd){
            return {...s, final: [], clearDelete: s.final}
        } else {
            return s
        }
    }
}

// Super Rotation System (SRS)
class Rotate implements Action{
    isClockWise: boolean 
    constructor(isClockWise: boolean){
        this.isClockWise = isClockWise
    }

    apply = (s: State): State => {
  
       // attempts blockRotation if not final position
        if (!isFinal(s.blocks)){
            const blockType = s.blockRotation.className
            const data = blockType.rotation(s.blocks, s.final, s.blockRotation.degrees, this.isClockWise)

            const newDegree = (this.isClockWise)? 
                                (s.blockRotation.degrees+90)%360 : 
                                (s.blockRotation.degrees == 0)? 270: s.blockRotation.degrees - 90;
            
            return { ...s,
                blocks: (data.update)?data.blocks:s.blocks,
                // blockRotation: {...s.blockRotation, degrees: (data.update)?(s.blockRotation.degrees+90)%360:s.blockRotation.degrees}
                blockRotation: {...s.blockRotation, degrees: (data.update)? newDegree:s.blockRotation.degrees}
            }
        } else{
           // reach top boundary
            if (highestPoint(s.blocks) <= 0){
            return { ...s,
                gameEnd: true,
                final: s.final.map( (block) => ({...block, id: block.label})),
                highscore: (s.score>s.highscore)?s.score:s.highscore,
            }
           // post final position reinitialisation
            } else {
                const nextTetro = s.nextBlock.value
                return { ...s, 
                    blocks: nextTetro.blocks, 
                    final: s.final.map( (block) => ({...block, id: block.label})), // update id to label
                    clearDelete: [],
                    clearAdjust: [],
                    blockRotation: { degrees: 0, className: nextTetro},
                    nextBlock: s.nextBlock.next()
                }
            }
        }
    }
}