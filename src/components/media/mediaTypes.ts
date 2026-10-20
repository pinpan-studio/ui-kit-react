export interface AudioTrack {
  src: string;
  title: string;
  artist?: string;
  /** Fichier source : permet de calculer la vraie forme d'onde. */
  blob?: Blob;
  icon?: string;
}
export type AudioPlayerVariant = 'default' | 'compact' | 'playlist';
export interface CarouselSlide {
  url?: string;
  title?: string;
  caption?: string;
  [key: string]: unknown;
}
export interface VideoTrack {
  src: string;
  label: string;
  srclang: string;
  default?: boolean;
}
export type PdfZoom = 'page-fit' | 'page-width' | number;
export interface GalleryImage {
  url: string;
  title?: string;
  caption?: string;
  /** Dimensions d'origine (nécessaires pour les lignes justifiées ; sinon 4:3). */
  width?: number;
  height?: number;
  category?: string;
  alt?: string;
  name?: string;
}
export type ImageGalleryLayout = 'grid' | 'justified' | 'masonry';
export interface VideoItem {
  id: string;
  title: string;
  /** Vidéo locale / même origine (blob:, data:, assets). */
  src?: string;
  /** URL ou identifiant YouTube (alternative à src). */
  youtube?: string;
  poster?: string;
  /** Durée affichée (« 4:12 »). */
  duration?: string;
  category?: string;
  author?: string;
  /** Ligne secondaire libre (« 1 248 vues · il y a 2 j »). */
  meta?: string;
  description?: string;
}
