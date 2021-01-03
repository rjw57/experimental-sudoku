import { KeyboardEvent, ComponentProps, useCallback } from 'react';
import { PuzzleControllerDispatchFunction } from './usePuzzleController';
import { Puzzle } from '../components';

export type EditMode = 'digit' | 'cornerPencil' | 'centrePencil' | 'given';

export type EditBehaviourHandlers = {
  handleKeyDown: Required<ComponentProps<typeof Puzzle>>['onKeyDown'],
};

export const useEditBehaviour = (
  mode: EditMode, dispatch: PuzzleControllerDispatchFunction
): EditBehaviourHandlers => ({
  handleKeyDown: useCallback((event: KeyboardEvent) => {
    const digit = '0123456789'.indexOf(event.key);
    if(digit >= 1 && digit <= 9) {
      switch(mode) {
        case 'digit':
          dispatch({ type: 'enterDigit', payload: { digit } });
          break;
        case 'given':
          dispatch({ type: 'enterGiven', payload: { digit } });
          break;
        case 'centrePencil':
          dispatch({ type: 'togglePencilMark', payload: { type: 'centre', digit } });
          break;
        case 'cornerPencil':
          dispatch({ type: 'togglePencilMark', payload: { type: 'corner', digit } });
          break;
      }
    }

    switch(event.key) {
      case 'Backspace':
        dispatch({
          type: 'clearCell',
          payload: {
            retainEntered: mode !== 'digit',
            retainCornerPencils: mode !== 'cornerPencil',
            retainCentrePencils: mode !== 'centrePencil',
            retainGivens: mode !== 'given',
          }
        });
        break;
      case 'z':
        event.ctrlKey && dispatch({ type: 'undo' });
        break;
    }
  }, [mode, dispatch]),
});

export default useEditBehaviour;
