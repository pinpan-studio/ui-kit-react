import { Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useMatches, useParams } from 'react-router';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import type { ComponentEntry } from '../../types/routes';

/** Page temporaire : chaque route déclarée pointe ici tant que l'écran n'est pas porté. */
export function PlaceholderPage() {
  const matches = useMatches();
  const params = useParams();
  const entry = matches.at(-1)?.handle as ComponentEntry | undefined;
  const title = entry?.title ?? 'Page';

  useEffect(() => {
    document.title = `${title} · UI Kit`;
  }, [title]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Écran en cours de portage depuis <code>{entry?.angularComponent}</code>.
      </Typography>
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`Route : ${entry?.path ?? ''}`} />
            <Chip label={`Groupe : ${entry?.group ?? ''}`} variant="outlined" />
            {Object.entries(params).map(([k, v]) => (
              <Chip key={k} label={`${k} = ${v ?? ''}`} color="primary" variant="outlined" />
            ))}
          </Stack>
          <TextField label="Champ M3 (aperçu)" placeholder="Saisir…" size="small" sx={{ maxWidth: 360 }} />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="contained" startIcon={<MaterialIcon name="check" />}>
              Principal
            </Button>
            <Button variant="outlined">Secondaire</Button>
            <Button variant="text">Texte</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
