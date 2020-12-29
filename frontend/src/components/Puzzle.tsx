import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    width: 400,
    height: 400,
    backgroundColor: 'white',
  },

  outerRect: {
    strokeWidth: 2,
    fill: 'none',
    stroke: 'black',
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
    strokeWidth: 1,
    fill: 'none',
    stroke: 'black',
  },
});

export interface PuzzleProps {
};

export const Puzzle = () => {
  const classes = useStyles();
  const cellSize = 20;

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
