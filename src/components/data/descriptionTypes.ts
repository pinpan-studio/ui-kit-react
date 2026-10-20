export interface DescriptionItem {
  label: string;
  value: string | number | null | undefined;
  icon?: string;
  /** Affiche un bouton de copie. */
  copy?: boolean;
  /** Occupe toute la largeur de la grille. */
  span?: 'full' | number;
  /** Rendu particulier de la valeur. */
  type?: 'text' | 'mono' | 'link' | 'email' | 'phone' | 'badge' | 'multiline';
  href?: string;
  /** Couleur du badge (token : success, warning, error, info, primary). */
  tone?: string;
  hint?: string;
}
