import { createContext } from 'react';
import type { InteractionApi } from './types';

export const InteractionContext = createContext<InteractionApi | null>(null);
