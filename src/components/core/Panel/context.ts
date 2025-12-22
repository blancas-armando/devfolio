/**
 * Panel Context
 *
 * React context for sharing panel dimensions with child components.
 * Allows Section and other components to know their container width.
 */

import { createContext, useContext } from 'react';
import { palette } from '../../../design/tokens.js';
import { width as widthConstants } from '../../../design/spacing.js';

export interface PanelContextValue {
  /** Total panel width including borders */
  width: number;
  /** Inner width (width - 2 for left/right borders) */
  innerWidth: number;
  /** Content width (innerWidth - 2 for padding) */
  contentWidth: number;
  /** Border color */
  borderColor: string;
}

const defaultContext: PanelContextValue = {
  width: widthConstants.full,
  innerWidth: widthConstants.full - 2,
  contentWidth: widthConstants.full - 4,
  borderColor: palette.border,
};

export const PanelContext = createContext<PanelContextValue>(defaultContext);

/**
 * Hook to access panel dimensions from child components
 */
export function usePanelContext(): PanelContextValue {
  return useContext(PanelContext);
}
