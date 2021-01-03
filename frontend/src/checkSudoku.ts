import { PuzzleCell } from './components';

export const checkSudoku = (cells: PuzzleCell[][]) => {
  // Solved sudokus must be 9x9
  if(cells.length !== 9 || !cells.every(r => r.length === 9)) {
    return false;
  }

  // Each row, column and box must have the digits 1 to 9
  for(let i=0; i<9; i++) {
    const row = cells[i].map(c => c.enteredDigit || c.givenDigit);
    const col = cells.map(r => r[i].enteredDigit || r[i].givenDigit);
    const box = [];
    for(let r=0; r<3; r++) {
      for(let c=0; c<3; c++) {
        const cell = cells[r+(i-(i%3))][c+3*(i%3)];
        box.push(cell.enteredDigit || cell.givenDigit);
      }
    }
    for(let d=1; d<=9; d++) {
      if(row.indexOf(d) === -1) { return false; }
      if(col.indexOf(d) === -1) { return false; }
      if(box.indexOf(d) === -1) { return false; }
    }
  }

  return true;
};

export default checkSudoku;
