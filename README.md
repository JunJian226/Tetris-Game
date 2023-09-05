# Assignment 1

## Usage

Setup (requires node.js):
```
> npm install
```

Start tests:
```
> npm test
```

Serve up the App (and ctrl-click the URL that appears in the console)
```
> npm run dev
```

## Game Controls: 
  - A     --  Moving block to left
  - S     --  Moving block to right
  - D     --  Moving block down 
  - W     --  Rotate block clockwise
  - Q     --  Rotate block anti-clockwise
  - Enter --  Restart game (only possible when game is already over)
  - Space --  Hard drop block

## Implementing features

Code of implmentation has been separated to the following files:
```
src/
  main.ts        -- main code logic inc. core game loop
  types.ts       -- common types, type aliases and interfaces
  util.ts        -- util functions
  state.ts       -- state processing and transformation
  tetromino.ts   -- tetromino classes, properties and methods
```
