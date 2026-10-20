// Porté depuis ui-kit Angular (harnais/components/widgets/media-widget.component.ts).
import { CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { AudioPlayer } from '../../../components/media/AudioPlayer';
import { ImageGallery } from '../../../components/media/ImageGallery';
import type { AudioTrack, GalleryImage, VideoItem } from '../../../components/media/mediaTypes';
import { PdfViewer } from '../../../components/media/PdfViewer';
import { VideoGallery } from '../../../components/media/VideoGallery';
import { VideoPlayer } from '../../../components/media/VideoPlayer';
import { YoutubePlayer } from '../../../components/media/YoutubePlayer';
import type { HarnaisWidget } from '../../../data/static/harnais.data';
import {
  buildSampleImageSet,
  buildSamplePdf,
  buildSampleWav,
  recordSampleVideo,
} from '../../../data/static/media.data';
import './media-widget.scss';

type MediaBlock = Extract<HarnaisWidget, { type: 'video' | 'videos' | 'audio' | 'pdf' | 'gallery' | 'image' }>;

/** Teintes des vidéos d'exemple générées (une par vidéo de galerie). */
const VIDEO_HUES = ['#4f6bed', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

interface MediaState {
  loading: boolean;
  videoSrc: string | null;
  videos: VideoItem[];
  tracks: AudioTrack[];
  pdf: Blob | null;
  pdfSrc: string | null;
  images: GalleryImage[];
}
const EMPTY: MediaState = {
  loading: false,
  videoSrc: null,
  videos: [],
  tracks: [],
  pdf: null,
  pdfSrc: null,
  images: [],
};

const Pending = ({ label }: { label: string }) => (
  <div className="pending">
    <CircularProgress size={22} />
    <span>{label}</span>
  </div>
);

/**
 * Widgets médias : lecteur vidéo (fichier ou YouTube), galerie vidéo, lecteur audio, lecteur PDF,
 * galerie d'images, image légendée. Sans source fournie, un exemple est généré localement : aucun téléchargement.
 */
export function HzMedia({ block: b }: { block: MediaBlock }) {
  const [s, setS] = useState<MediaState>(EMPTY);

  useEffect(() => {
    let destroyed = false;
    const urls: string[] = [];
    const url = (blob: Blob) => {
      const u = URL.createObjectURL(blob);
      urls.push(u);
      return u;
    };
    const set = (patch: Partial<MediaState>) => setS((p) => ({ ...p, ...patch }));
    switch (b.type) {
      case 'video':
        if (b.src) set({ videoSrc: b.src });
        else if (!b.youtube) {
          set({ loading: true });
          void recordSampleVideo(b.seconds ?? 6, 640, 360, { title: b.title }).then((blob) => {
            if (!destroyed) set({ videoSrc: blob ? url(blob) : null, loading: false });
          });
        }
        break;
      case 'videos': {
        const samples = b.videos.filter((v) => v.sample && !v.src && !v.youtube);
        if (!samples.length) {
          set({ videos: b.videos });
          break;
        }
        set({ loading: true });
        void Promise.all(
          samples.map((v, i) =>
            recordSampleVideo(5, 640, 360, { title: v.title, color: VIDEO_HUES[i % VIDEO_HUES.length] }),
          ),
        ).then((blobs) => {
          if (destroyed) return;
          const src = new Map(samples.map((v, i) => [v.id, ((b2) => (b2 ? url(b2) : undefined))(blobs[i])]));
          // Les vidéos d'exemple que le navigateur n'a pas su enregistrer sont écartées.
          set({
            videos: b.videos
              .filter((v) => !src.has(v.id) || src.get(v.id))
              .map((v) => (src.get(v.id) ? { ...v, src: src.get(v.id) } : v)),
            loading: false,
          });
        });
        break;
      }
      case 'audio':
        set({
          tracks: b.tracks.map((t, i) => {
            if (t.src) return { title: t.title, artist: t.artist, src: t.src, icon: t.icon };
            const blob = buildSampleWav(t.sample ?? 12, i);
            return { title: t.title, artist: t.artist, icon: t.icon, src: url(blob), blob };
          }),
        });
        break;
      case 'pdf':
        if (b.src) set({ pdfSrc: b.src });
        else {
          const blob = buildSamplePdf(b.title ?? 'Document', b.pages ?? 3);
          set({ pdf: blob, pdfSrc: url(blob) });
        }
        break;
      case 'gallery':
        set({
          images: b.images?.length
            ? b.images
            : buildSampleImageSet(b.sample ?? 8).map((img) => ({
                url: img.url,
                width: img.width,
                height: img.height,
                category: img.category,
                name: img.name,
                title: img.caption,
                caption: img.category,
              })),
        });
        break;
    }
    return () => {
      destroyed = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [b]);

  let body: React.ReactNode = null;
  switch (b.type) {
    case 'video':
      body = (
        <>
          {b.youtube ? (
            <YoutubePlayer video={b.youtube} title={b.title ?? ''} duration={b.duration ?? ''} />
          ) : s.loading ? (
            <Pending label="Préparation de la vidéo…" />
          ) : (
            <VideoPlayer
              src={s.videoSrc}
              poster={b.poster ?? ''}
              title={b.title ?? ''}
              emptyLabel="Ce navigateur ne sait pas générer la vidéo d’exemple."
            />
          )}
          {b.caption && <p className="caption">{b.caption}</p>}
        </>
      );
      break;
    case 'videos':
      body = s.loading ? (
        <Pending label="Préparation des vidéos…" />
      ) : (
        <VideoGallery videos={s.videos} layout={b.layout ?? 'grid'} minCardWidth={200} />
      );
      break;
    case 'audio':
      body = <AudioPlayer tracks={s.tracks} variant={b.variant ?? (b.tracks.length > 1 ? 'playlist' : 'default')} />;
      break;
    case 'pdf':
      body = (
        <PdfViewer src={s.pdfSrc} blob={s.pdf} name={b.name ?? 'document.pdf'} height={(b.height ?? 460) + 'px'} />
      );
      break;
    case 'gallery':
      body = <ImageGallery images={s.images} layout={b.layout ?? 'grid'} minWidth={150} rowHeight={150} />;
      break;
    case 'image':
      body = (
        <figure className="image">
          <img src={b.src} alt={b.alt ?? b.caption ?? ''} loading="lazy" />
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      );
      break;
  }
  return <div className="hz-media">{body}</div>;
}
