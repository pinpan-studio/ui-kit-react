import { Icon, type IconProps } from '@mui/material';

/** Icône Material (police `Material Icons`, mêmes ligatures que mat-icon côté Angular). */
export function MaterialIcon({
  name,
  size,
  sx,
  ...rest
}: { name: string; size?: number } & Omit<IconProps, 'children'>) {
  return (
    <Icon
      aria-hidden
      baseClassName="material-icons"
      sx={{ ...(size ? { fontSize: size, width: size, height: size } : {}), ...sx }}
      {...rest}
    >
      {name}
    </Icon>
  );
}
