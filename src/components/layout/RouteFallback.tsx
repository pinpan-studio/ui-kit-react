import { Box, CircularProgress } from '@mui/material';

export function RouteFallback() {
  return (
    <Box role="status" aria-label="Chargement" sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
      <CircularProgress />
    </Box>
  );
}
