export interface Puzzle {
  givens: (number | null)[9][9];
};

export interface Solve {
  puzzle: Puzzle;
  entries: (number | null)[9][9];
  cornerPencils: number[][9][9];
  centrePencils: number[][9][9];
};

export interface User {
  uid: string;
  displayName: string;
};
