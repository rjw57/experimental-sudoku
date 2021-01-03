import { KeyboardEvent, ComponentProps, useCallback } from 'react';
import { PuzzleControllerDispatchFunction } from './usePuzzleController';
import { Puzzle } from '../components';

export type SelectionBehaviourHandlers = {
  handleKeyDown: Required<ComponentProps<typeof Puzzle>>['onKeyDown'],
  handleCellClick: Required<ComponentProps<typeof Puzzle>>['onCellClick'],
  handleCellDragStart: Required<ComponentProps<typeof Puzzle>>['onCellDragStart'],
  handleCellDrag: Required<ComponentProps<typeof Puzzle>>['onCellDrag'],
};

export const useSelectionBehaviour = (
  dispatch: PuzzleControllerDispatchFunction
): SelectionBehaviourHandlers => ({
  handleKeyDown: useCallback((event: KeyboardEvent) => {
    switch(event.key) {
      case 'ArrowUp':
        event.preventDefault();
        dispatch({
          type: 'setCursor', payload: {
            row: -1, column: 0, relative: true, extendSelection: event.shiftKey,
            preserveSelection: event.ctrlKey
          }
        });
        break;
      case 'ArrowDown':
        event.preventDefault();
        dispatch({
          type: 'setCursor', payload: {
            row: 1, column: 0, relative: true, extendSelection: event.shiftKey,
            preserveSelection: event.ctrlKey
          }
        });
        break;
      case 'ArrowLeft':
        event.preventDefault();
        dispatch({
          type: 'setCursor', payload: {
            row: 0, column: -1, relative: true, extendSelection: event.shiftKey,
            preserveSelection: event.ctrlKey
          }
        });
        break;
      case 'ArrowRight':
        event.preventDefault();
        dispatch({
          type: 'setCursor', payload: {
            row: 0, column: 1, relative: true, extendSelection: event.shiftKey,
            preserveSelection: event.ctrlKey
          }
        });
        break;
      case 'Escape':
        event.preventDefault();
        dispatch({ type: 'updateSelection', payload: { selection: [] } });
        break;
    }
  }, [dispatch]),
  handleCellClick: useCallback(({row, column, ctrlKey}) => dispatch({
    type: 'setCursor', payload: { row, column, extendSelection: ctrlKey }
  }), [dispatch]),
  handleCellDragStart: useCallback(({row, column, ctrlKey}) => dispatch({
    type: 'setCursor', payload: { row, column, extendSelection: ctrlKey }
  }), [dispatch]),
  handleCellDrag: useCallback(({row, column }) => dispatch({
    type: 'setCursor', payload: { row, column, extendSelection: true }
  }), [dispatch]),
});

export default useSelectionBehaviour;
