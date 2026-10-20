import { useMediaQuery } from '@mui/material';
import { LAYOUT } from '../theme/tokens';

/** Même seuil que le BreakpointObserver du KitLayout Angular. */
export const useIsMobile = (): boolean => useMediaQuery(`(max-width: ${LAYOUT.mobileMaxWidth}px)`, { noSsr: true });
