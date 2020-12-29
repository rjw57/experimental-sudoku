import { makeStyles, Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: 400,
    height: 400,
    backgroundColor: 'white',
  },

  outerRect: {
    strokeWidth: 3,
    fill: 'none',
    stroke: 'black',
    pointerEvents: 'none',
  },

  cellRect: {
    strokeWidth: 0.5,
    fill: 'white',
    stroke: 'black',

    '&:hover': {
      fill: 'yellow',
      fillOpacity: 0.25,
    },
  },

  boxRect: {
    strokeWidth: 1.5,
    fill: 'none',
    stroke: 'black',
    pointerEvents: 'none',
  },

  givenDigit: {
    ...theme.typography.body1,

    pointerEvents: 'none',
    textAnchor: 'middle',
    dominantBaseline: 'central',
    fontSize: '15px',
  },

  enteredDigit: {
    ...theme.typography.body1,

    pointerEvents: 'none',
    textAnchor: 'middle',
    dominantBaseline: 'central',
    fontSize: '15px',
    fill: 'blue',
  },
}));

export interface PuzzleProps {
};

export const Puzzle = () => {
  const classes = useStyles();
  const cellSize = 20;

  const givens = [
    {row: 1, column: 2, digit: 7},
  ];

  const entered = [
    {row: 2, column: 8, digit: 1},
    {row: 3, column: 1, digit: 2},
    {row: 2, column: 2, digit: 3},
    {row: 4, column: 8, digit: 4},
    {row: 6, column: 7, digit: 5},
    {row: 7, column: 6, digit: 6},
    {row: 8, column: 2, digit: 7},
    {row: 2, column: 6, digit: 8},
    {row: 1, column: 0, digit: 9},
  ];

  return (
    <svg className={classes.root} viewBox={[0, 0, 9*cellSize, 9*cellSize].join(' ')}>
      {
        (new Array(9)).fill(null).map((_, row) => (
          <>
          {
            (new Array(9)).fill(null).map((_, col) => (
              <rect
                key={`cell-${row}-${col}`} className={classes.cellRect}
                x={col*cellSize} y={row*cellSize}
                width={cellSize} height={cellSize}
              />
            ))
          }
          </>
        ))
      }
      {
        givens.map(({ row, column, digit }) => (
          <text
            key={`given-${row}-${column}`} className={classes.givenDigit}
            x={(0.5+column)*cellSize} y={(-0.5+row)*cellSize}
          >{
            digit
          }</text>
        ))
      }
      {
        entered.map(({ row, column, digit }) => (
          <text
            key={`entered-${row}-${column}`} className={classes.enteredDigit}
            x={(0.5+column)*cellSize} y={(-0.5+row)*cellSize}
          >{
            digit
          }</text>
        ))
      }
      <rect className={classes.outerRect} x={0} y={0} width={9*cellSize} height={9*cellSize} />
      {
        (new Array(3)).fill(null).map((_, row) => (
          <>
          {
            (new Array(3)).fill(null).map((_, col) => (
              <rect
                key={`box-${row}-${col}`} className={classes.boxRect}
                x={col*cellSize*3} y={row*cellSize*3}
                width={cellSize*3} height={cellSize*3}
              />
            ))
          }
          </>
        ))
      }
    </svg>
  );
};

export default Puzzle;
