import { useState, SVGProps, MouseEvent, KeyboardEvent, SyntheticEvent } from 'react';
import { Theme, makeStyles, createStyles } from '@material-ui/core';
import { StyledComponentProps, ClassKeyOfStyles } from '@material-ui/styles';

export interface PuzzleCell {
  givenDigit?: number;
  enteredDigit?: number;
  cornerPencilDigits?: number[];
  centrePencilDigits?: number[];
};

export type PuzzleSelection = {row: number, column: number}[];

const styles = (theme: Theme) => createStyles({
  root: { },

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
      fill: theme.palette.action.hover,
    },
  },

  boxRect: {
    strokeWidth: 1.5,
  },

  digit: {
    ...theme.typography.body1,
    userSelect: 'none',
    pointerEvents: 'none',
    textAnchor: 'middle',
    fill: 'black',
  },

  givenDigit: {
  },

  enteredDigit: {
    fill: theme.palette.primary.main,
  },

  centrePencilDigit: {
    fill: theme.palette.primary.main,
  },

  cornerPencilDigit: {
    fill: theme.palette.primary.main,
  },

  selection: {
    fill: 'yellow',
  },
});

const useStyles = makeStyles(styles);

export interface CellMouseEvent extends MouseEvent {
  row: number;
  column: number;
};

export interface PuzzleProps extends StyledComponentProps<ClassKeyOfStyles<typeof styles>> {
  selection?: PuzzleSelection;
  cells?: PuzzleCell[][];
  tabIndex?: number;
  onCellClick?: (event: CellMouseEvent) => void;
  onCellDragStart?: (event: CellMouseEvent) => void;
  onCellDrag?: (event: CellMouseEvent) => void;
  onCellDragEnd?: (event: CellMouseEvent) => void;
  onFocus?: (event: SyntheticEvent) => void;
  onBlur?: (event: SyntheticEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void
  svgProps?: SVGProps<SVGSVGElement>;
};

export const Puzzle = (props: PuzzleProps) => {
  const {
    cells = [], selection = [],
    onCellClick, onCellDragStart, onCellDrag, onCellDragEnd, onFocus, onBlur, onKeyDown,
    tabIndex = -1,
    svgProps
  } = props;
  const classes = useStyles(props);

  const [dragStartEvent, setDragStartEvent] = useState<CellMouseEvent | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const handleDragStart = (event: MouseEvent, row: number, column: number) => {
    onCellDragStart && onCellDragStart({...event, row, column});
  }
  const handleDrag = (event: MouseEvent, row: number, column: number) => {
    isDragging && onCellDrag && onCellDrag({...event, row, column});
  }
  const handleDragEnd = (event: MouseEvent, row: number, column: number) => {
    onCellDragEnd && onCellDragEnd({...event, row, column});
  }

  const cellSize = 20;
  const textShift = '0.6ex';
  const cornerPencilAnchors = [
    { x: (1/6) * cellSize, y: (1/6) * cellSize },
    { x: (3/6) * cellSize, y: (1/6) * cellSize },
    { x: (5/6) * cellSize, y: (1/6) * cellSize },
    { x: (1/6) * cellSize, y: (3/6) * cellSize },
    { x: (5/6) * cellSize, y: (3/6) * cellSize },
    { x: (1/6) * cellSize, y: (5/6) * cellSize },
    { x: (3/6) * cellSize, y: (5/6) * cellSize },
    { x: (5/6) * cellSize, y: (5/6) * cellSize },
  ];

  return (
    <svg
      className={classes.root} viewBox={[0, 0, 9*cellSize, 9*cellSize].join(' ')}
      onKeyDown={onKeyDown} onFocus={onFocus} onBlur={onBlur} tabIndex={tabIndex}
      {...svgProps}
    >
      {
        selection.map(({ row, column }, index) => (
          <rect
            key={index} className={classes.selection}
            x={column*cellSize} y={row*cellSize}
            width={cellSize} height={cellSize}
          />
        ))
      }
      {
        cells && cells.map((rowCells, row) => rowCells.map((cell, column) => {
          const { givenDigit, enteredDigit, cornerPencilDigits, centrePencilDigits } = cell;
          const index = row * 9 + column;

          // A given digit trumps any entries.
          if(typeof givenDigit !== 'undefined') {
            return (
              <text
                key={index} className={[classes.digit, classes.givenDigit].join(' ')}
                x={(0.5+column)*cellSize} y={(0.5+row)*cellSize} dy={textShift}
                style={{fontSize: 0.8*cellSize}}
              >{
                givenDigit
              }</text>
            );
          }

          // An entered digit trumps pencil marks.
          if(typeof enteredDigit !== 'undefined') {
            return (
              <text
                key={index} className={[classes.digit, classes.enteredDigit].join(' ')}
                x={(0.5+column)*cellSize} y={(0.5+row)*cellSize} dy={textShift}
                style={{fontSize: 0.8*cellSize}}
              >{
                enteredDigit
              }</text>
            );
          }

          return <g key={index}>
            {
              centrePencilDigits && (
                <text
                  className={[classes.digit, classes.centrePencilDigit].join(' ')}
                  x={(0.5+column)*cellSize} y={(0.5+row)*cellSize} dy={textShift}
                  style={{fontSize: centrePencilDigits.length >= 6 ? 0.2*cellSize : 0.25*cellSize}}
                >{
                  centrePencilDigits.join('')
                }</text>
              )
            }
            {
              cornerPencilDigits && cornerPencilDigits.map((digit, index) => {
                const {x, y} = cornerPencilAnchors[index % cornerPencilAnchors.length];
                return (
                  <text
                    key={index}
                    className={[classes.digit, classes.cornerPencilDigit].join(' ')}
                    x={column*cellSize + x} y={row*cellSize + y} dy={textShift}
                    style={{fontSize: 0.25*cellSize}}
                  >{
                    digit
                  }</text>
                );
              })
            }
          </g>;
        }))
      }
      <rect
        className={[classes.rect, classes.outerRect].join(' ')}
        x={0} y={0} width={9*cellSize} height={9*cellSize}
      />
      {
        (new Array(3)).fill(null).map((_, row) => (
          (new Array(3)).fill(null).map((_, column) => (
            <rect
              key={row*9 + column} className={[classes.rect, classes.boxRect].join(' ')}
              x={column*cellSize*3} y={row*cellSize*3}
              width={cellSize*3} height={cellSize*3}
            />
          ))
        ))
      }
      {
        (new Array(9)).fill(null).map((_, row) => (
          (new Array(9)).fill(null).map((_, column) => (
            <rect
              key={row*9 + column} className={[classes.rect, classes.cellRect].join(' ')}
              x={column*cellSize} y={row*cellSize}
              width={cellSize} height={cellSize}
              onClick={event => {
                onCellClick && onCellClick({...event, row, column});
              }}
              onMouseDown={event => {
                if(!isDragging) {
                  setIsDragging(true);
                  setDragStartEvent({...event, row, column});
                }
              }}
              onMouseMove={isDragging ? (event => {
                if(isDragging) {
                  // If this is the first movement, send the drag start event.
                  if(dragStartEvent) {
                    setDragStartEvent(undefined);
                    handleDragStart(dragStartEvent, row, column);
                  }

                  if(event.buttons === 0) {
                    // If no button is pressed, end the drag event.
                    setIsDragging(false);
                    setDragStartEvent(undefined);
                    handleDragEnd(event, row, column);
                  } else {
                    // Continue the drag event.
                    handleDrag(event, row, column);
                  }
                }
              }) : undefined}
              onMouseUp={event => {
                setIsDragging(false);
                if(dragStartEvent) {
                  setDragStartEvent(undefined);
                  handleDragEnd(event, row, column);
                }
              }}
            />
          ))
        ))
      }
    </svg>
  );
};

export default Puzzle;
