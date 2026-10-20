import { Box } from '@mui/material';
import { keyLabels } from '../../lib/keys';

/** Touche(s) de clavier stylées, adaptées à la plateforme (⌘ / Ctrl) — équivalent `<app-kbd>`. */
export function Kbd({ keys, className }: { keys: string; className?: string }) {
  const sequences = keys
    .trim()
    .split(/\s+/)
    .map((s) => keyLabels(s));
  return (
    <Box
      component="span"
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        verticalAlign: 'middle',
        '& kbd': {
          minWidth: 20,
          height: 20,
          px: '5px',
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '5px',
          border: '1px solid var(--border-color)',
          borderBottomWidth: 2,
          bgcolor: 'var(--card-bg)',
          color: 'var(--text-secondary)',
          font: "600 11px 'Inter', sans-serif",
          lineHeight: 1,
        },
        '& .then': { fontSize: 11, color: 'var(--text-muted)', mx: '2px' },
      }}
    >
      {sequences.map((seq, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {seq.map((k, j) => (
            <kbd key={j}>{k}</kbd>
          ))}
          {i < sequences.length - 1 && <span className="then">puis</span>}
        </span>
      ))}
    </Box>
  );
}
