import { createContext } from 'react';

export type SnackFn = (message: string, opts?: { action?: string; duration?: number }) => void;
export const SnackbarContext = createContext<SnackFn | null>(null);
