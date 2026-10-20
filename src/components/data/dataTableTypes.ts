export type DataCellType = 'text' | 'number' | 'currency' | 'date' | 'badge' | 'progress' | 'mono';
export type DataRow = Record<string, unknown>;

export interface DataColumn<T = DataRow> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  /** Colonne figée à gauche (`start`) ou à droite (`end`). */
  sticky?: 'start' | 'end';
  align?: 'left' | 'right' | 'center';
  type?: DataCellType;
  sortable?: boolean;
  /** Édition en ligne au double-clic. */
  editable?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  /** Masquée par défaut (réactivable via le menu Colonnes). */
  hidden?: boolean;
  /** Non masquable. */
  required?: boolean;
  /** Couleur d'un badge selon la valeur (token : success, warning…). */
  tone?: (row: T) => string;
  format?: (row: T) => string;
  /** Total en pied de tableau (somme des lignes filtrées). */
  total?: boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  tone?: 'error' | 'primary';
}
export interface CellEditEvent<T = DataRow> {
  row: T;
  key: string;
  value: unknown;
  previous: unknown;
}
