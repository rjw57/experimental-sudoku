import { makeStyles, Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: 500,
    height: 500,
    backgroundColor: 'white',
  },

  rect: {
    fill: 'none',
    stroke: 'black',
    pointerEvents: 'none',
  },

  outerRect: {
    strokeWidth: 3,
  },

  cellRect: {
    strokeWidth: 0.5,
    pointerEvents: 'fill',

    '&:hover': {
      fill: 'yellow',
      fillOpacity: 0.25,
    },
  },

  boxRect: {
    strokeWidth: 1.5,
  },

  digit: {
    ...theme.typography.body1,
    pointerEvents: 'none',
    textAnchor: 'middle',
    dominantBaseline: 'mathematical',
  },

  givenDigit: {
    fontSize: 14,
  },

  enteredDigit: {
    fill: 'blue',
    fontSize: 14,
  },

  centralPencilDigit: {
    fontSize: 6,
    fill: 'blue',
  },

  centralPencilDigitCondensed: {
    fontSize: 4,
  }
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

  const centralPencil = [
    {row: 2, column: 4, digits: [1, 2, 3, 4, 5, 6]},
    {row: 3, column: 4, digits: [1, 2, 3]},
  ];

  return (
    <svg className={classes.root} viewBox={[0, 0, 9*cellSize, 9*cellSize].join(' ')}>
      {
        (new Array(9)).fill(null).map((_, row) => (
          <>
          {
            (new Array(9)).fill(null).map((_, col) => (
              <rect
                key={`cell-${row}-${col}`} className={`${classes.rect} ${classes.cellRect}`}
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
            key={`given-${row}-${column}`} className={`${classes.digit} ${classes.givenDigit}`}
            x={(0.5+column)*cellSize} y={(-0.5+row)*cellSize}
          >{
            digit
          }</text>
        ))
      }
      {
        entered.map(({ row, column, digit }) => (
          <text
            key={`entered-${row}-${column}`} className={`${classes.digit} ${classes.enteredDigit}`}
            x={(0.5+column)*cellSize} y={(-0.5+row)*cellSize}
          >{
            digit
          }</text>
        ))
      }
      {
        centralPencil.map(({ row, column, digits }) => (
          <text
            key={`centralPencil-${row}-${column}`}
            className={`${classes.digit} ${classes.centralPencilDigit} ${digits.length >= 6 ? classes.centralPencilDigitCondensed : ''}`}
            x={(0.5+column)*cellSize} y={(-0.5+row)*cellSize}
          >{
            digits.join('')
          }</text>
        ))
      }
      <rect
        className={`${classes.rect} ${classes.outerRect}`}
        x={0} y={0} width={9*cellSize} height={9*cellSize}
      />
      {
        (new Array(3)).fill(null).map((_, row) => (
          <>
          {
            (new Array(3)).fill(null).map((_, col) => (
              <rect
                key={`box-${row}-${col}`} className={`${classes.rect} ${classes.boxRect}`}
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
