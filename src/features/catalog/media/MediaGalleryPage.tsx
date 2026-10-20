import { Button, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MatSpinner } from '../../../components/mat/MatData';
import {
  AudioPlayer,
  Carousel,
  ImageCropper,
  ImageGallery,
  MasonryGrid,
  MEDIA_ICON,
  mediaKind,
  PdfViewer,
  useFileViewer,
  VideoGallery,
  VideoPlayer,
  YoutubePlayer,
  youtubeId,
  type AudioTrack,
  type CarouselSlide,
  type GalleryImage,
  type VideoItem,
  type VideoTrack,
  type ViewerFile,
} from '../../../components/media';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import {
  buildSampleImages,
  buildSampleImageSet,
  buildSamplePdf,
  buildSampleWav,
  formatBytes,
  recordSampleVideo,
} from '../../../data/static/media.data';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { CODE } from './mediaCode';
import './media-gallery.scss';

const TOC: TocItem[] = [
  { id: 'video', label: 'Lecteur vidéo' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'audio', label: 'Lecteur audio' },
  { id: 'pdf', label: 'Lecteur PDF' },
  { id: 'viewer', label: 'Visionneuse' },
  { id: 'carousel', label: 'Carrousel' },
  { id: 'image-gallery', label: 'Galerie d’images' },
  { id: 'video-gallery', label: 'Galerie vidéo' },
  { id: 'masonry', label: 'Masonry' },
  { id: 'cropper', label: 'Recadrage' },
];
const TITLES = [
  'Flotte du Plateau',
  'Dépôt de Yopougon',
  'Axe Abidjan – Yamoussoukro',
  'Port de San-Pédro',
  'Atelier balises',
  'Livraison matinale',
  'Contrôle technique',
  'Parc de Bouaké',
  'Quai de chargement',
  'Station Treichville',
  'Convoi nord',
  'Entrepôt Koumassi',
  'Pont HKB',
  'Atelier Marcory',
];
const YT_VIDEOS = [
  { id: 'aqz-KE-bpKQ', title: 'Big Buck Bunny — Blender Foundation', duration: '10:34' },
  { id: 'eRsGyueVLvQ', title: 'Sintel — Blender Foundation', duration: '14:48' },
] as const;
const YT_ITEMS: VideoItem[] = [
  {
    id: 'yt1',
    title: 'Big Buck Bunny',
    youtube: 'aqz-KE-bpKQ',
    duration: '10:34',
    category: 'Tutoriels',
    author: 'Blender Foundation',
    meta: 'YouTube · court-métrage libre',
  },
  {
    id: 'yt2',
    title: 'Sintel',
    youtube: 'eRsGyueVLvQ',
    duration: '14:48',
    category: 'Tutoriels',
    author: 'Blender Foundation',
    meta: 'YouTube · court-métrage libre',
  },
];
const CARDS = [
  { title: 'Balise GPS 4G', price: '45 000 FCFA', icon: 'router', tone: 'primary' },
  { title: 'Capteur carburant', price: '120 000 FCFA', icon: 'local_gas_station', tone: 'warning' },
  { title: 'Caméra embarquée', price: '95 000 FCFA', icon: 'videocam', tone: 'purple' },
  { title: 'Coupe-moteur', price: '25 000 FCFA', icon: 'power_settings_new', tone: 'error' },
  { title: 'Lecteur RFID', price: '38 000 FCFA', icon: 'contactless', tone: 'success' },
  { title: 'Bouton SOS', price: '12 000 FCFA', icon: 'sos', tone: 'info' },
];
const MASONRY_NOTES = [
  {
    t: 'Sortie de zone',
    d: 'CI-9902-NP a quitté la géofence « Port-Bouët » à 11:42.',
    icon: 'wrong_location',
    tone: 'error',
    tags: ['Alerte'],
  },
  { t: 'PV signé', d: 'Installation validée chez Transports Yao & Fils.', icon: 'task_alt', tone: 'success', tags: [] },
  {
    t: 'Rapport de septembre',
    d: '1 248 véhicules suivis, 97,4 % de disponibilité, 23 alertes résolues sur 25. Consommation moyenne en baisse de 6 % par rapport à août grâce à la réduction des ralentis moteur.',
    icon: 'insights',
    tone: 'primary',
    tags: ['Rapport', 'Mensuel'],
  },
  { t: 'Maintenance', d: 'Vidange CI-6630-QR prévue lundi.', icon: 'build', tone: 'warning', tags: ['Atelier'] },
  {
    t: 'Nouveau client',
    d: 'Bolloré Logistics CI rejoint la plateforme avec 36 véhicules.',
    icon: 'person_add',
    tone: 'info',
    tags: ['Commercial'],
  },
  {
    t: 'Note du technicien',
    d: 'Le connecteur OBD du véhicule CI-0418-GH est oxydé : prévoir un remplacement lors du prochain passage. Le client a été prévenu par téléphone et accepte le devis.',
    icon: 'engineering',
    tone: 'purple',
    tags: ['Intervention', 'Devis'],
  },
  { t: 'Batterie faible', d: 'CI-0418-GH : 11,2 V.', icon: 'battery_alert', tone: 'warning', tags: [] },
  {
    t: 'Objectif atteint',
    d: '100 % des balises en ligne pendant 7 jours consécutifs.',
    icon: 'emoji_events',
    tone: 'success',
    tags: ['Qualité'],
  },
];
const VIDEO_VARIANTS = [
  {
    id: 'v1',
    title: 'Trajet CI-4521-AB',
    color: '#4f6bed',
    background: '#0f172a',
    category: 'Trajets',
    author: 'Koffi N’Guessan',
    meta: 'Plateau → Abobo · 42 km',
  },
  {
    id: 'v2',
    title: 'Tournée de livraison',
    color: '#22c55e',
    background: '#052e16',
    category: 'Trajets',
    author: 'Aminata Diallo',
    meta: 'Yopougon · 18 arrêts',
  },
  {
    id: 'v3',
    title: 'Test du coupe-moteur',
    color: '#f59e0b',
    background: '#1c1917',
    category: 'Installations',
    author: 'Serge Kouamé',
    meta: 'Atelier Marcory',
  },
];
const VTT = `WEBVTT

00:00.000 --> 00:02.000
Départ du dépôt de Yopougon

00:02.000 --> 00:04.000
Passage sur l’autoroute du Nord

00:04.000 --> 00:06.500
Arrivée chez le client à Abobo
`;

/** Médias générés localement, construits une seule fois (équivalent des champs readonly du composant Angular). */
function buildStatic(url: (b: Blob) => string) {
  const imageSet = buildSampleImageSet(14);
  const gallery: GalleryImage[] = imageSet.map((img, i) => ({
    url: img.url,
    width: img.width,
    height: img.height,
    category: img.category,
    name: `photo-${i + 1}.jpg`,
    title: TITLES[i],
    caption: `${img.width} × ${img.height} · ${img.category}`,
  }));
  const images = buildSampleImages();
  const slides: CarouselSlide[] = images.map((i) => ({ url: i.url, title: i.caption, caption: i.name }));
  const subtitles: VideoTrack[] = [
    { label: 'Français', srclang: 'fr', default: false, src: url(new Blob([VTT], { type: 'text/vtt' })) },
  ];
  const tracks: (AudioTrack & { blob: Blob })[] = [
    {
      title: 'Appel client — Transports Yao',
      artist: 'Support · 14 oct. 2026',
      icon: 'support_agent',
      blob: buildSampleWav(12, 0),
    },
    { title: 'Message vocal — technicien', artist: 'Koffi N’Guessan', icon: 'engineering', blob: buildSampleWav(8, 2) },
    {
      title: 'Alerte sonore — sortie de zone',
      artist: 'Bibliothèque de sons',
      icon: 'notifications_active',
      blob: buildSampleWav(5, 4),
    },
  ].map((t) => ({ ...t, src: url(t.blob) }));
  const pdfBlob = buildSamplePdf('Contrat cadre 2026', 4);
  const pdfUrl = url(pdfBlob);
  const facture = new Blob(
    ['Facture FAC-2026-0981\nClient : Transports Yao & Fils\nMontant : 1 250 000 FCFA\nÉchéance : 30/10/2026\n'],
    { type: 'text/plain' },
  );
  const zip = new Blob([new Uint8Array([80, 75, 3, 4])], { type: 'application/zip' });
  const t0 = tracks[0];
  const files: ViewerFile[] = [
    ...images
      .slice(0, 3)
      .map((i) => ({ name: i.name, url: i.url, type: 'image/png', size: Math.round(i.url.length * 0.75) })),
    { name: 'contrat-cadre-2026.pdf', url: pdfUrl, type: 'application/pdf', size: pdfBlob.size, blob: pdfBlob },
    ...(t0 ? [{ name: 'appel-client.wav', url: t0.src, type: 'audio/wav', size: t0.blob.size, blob: t0.blob }] : []),
    { name: 'facture-0981.txt', url: url(facture), type: 'text/plain', size: facture.size, blob: facture },
    { name: 'export-balises.zip', url: url(zip), type: 'application/zip', size: 2_480_000 },
  ];
  return { gallery, images, slides, subtitles, tracks, pdfBlob, pdfUrl, files };
}

const iconOf = (f: ViewerFile) => MEDIA_ICON[mediaKind(f.name, f.type)];

export function MediaGalleryPage() {
  const viewer = useFileViewer();
  // URL blob des fichiers choisis / générés. Les médias statiques ne sont pas révoqués au démontage :
  // en StrictMode le composant est remonté avec le même état (révoquer casserait les URL réutilisées).
  const urls = useRef<string[]>([]);
  const url = (b: Blob) => {
    const u = URL.createObjectURL(b);
    urls.current.push(u);
    return u;
  };
  const [S] = useState(() => buildStatic(url));
  const masonryImages = useMemo(() => S.gallery.slice(0, 10), [S]);
  const voice = useMemo(() => S.tracks.slice(1, 2), [S]);
  const firstTrack = useMemo(() => S.tracks.slice(0, 1), [S]);

  const [selectedImages, setSelectedImages] = useState<GalleryImage[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>(YT_ITEMS);
  const [videoGenerating, setVideoGenerating] = useState(true);
  const [masonryCols, setMasonryCols] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<'loading' | 'ready' | 'unsupported'>('loading');
  const [localVideo, setLocalVideo] = useState<string | null>(null);
  const [ytInput, setYtInput] = useState('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  const [ytCurrent, setYtCurrent] = useState('aqz-KE-bpKQ');
  const [ytEvents, setYtEvents] = useState<string[]>([]);
  const [localPdf, setLocalPdf] = useState<{ url: string; name: string; blob: Blob } | null>(null);
  const [files, setFiles] = useState<ViewerFile[]>(S.files);
  const [cropSrc, setCropSrc] = useState<string | null>(S.images[2]?.url ?? null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const own: string[] = [];
    const u = (b: Blob) => {
      const x = URL.createObjectURL(b);
      own.push(x);
      return x;
    };
    // Trois courtes vidéos enregistrées en parallèle pour la galerie vidéo.
    void Promise.all(VIDEO_VARIANTS.map((v) => recordSampleVideo(5, 640, 360, v))).then((blobs) => {
      if (!alive) return;
      const local: VideoItem[] = [];
      blobs.forEach((b, i) => {
        const v = VIDEO_VARIANTS[i];
        if (b && v)
          local.push({
            ...v,
            src: u(b),
            duration: '0:05',
            description: 'Vidéo générée localement depuis un canvas (MediaRecorder) pour la démonstration.',
          });
      });
      setVideoItems((l) => [...local, ...l]);
      setVideoGenerating(false);
    });
    void recordSampleVideo(6).then((b) => {
      if (!alive) return;
      if (!b) {
        setVideoState('unsupported');
        return;
      }
      const x = u(b);
      setVideoUrl(x);
      setVideoState('ready');
      setFiles((l) => [
        ...l.slice(0, 4),
        { name: 'trajet-ci-4521.webm', url: x, type: b.type, size: b.size },
        ...l.slice(4),
      ]);
    });
    return () => {
      alive = false;
      own.forEach((x) => URL.revokeObjectURL(x));
    };
  }, []);

  const loadYt = () => setYtCurrent(youtubeId(ytInput) ?? ytInput);
  const logYt = (s: string) =>
    setYtEvents((l) => [`${new Date().toLocaleTimeString('fr-FR')} — ${s}`, ...l].slice(0, 4));
  const pick = (accept: string, cb: (f: File, u: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) cb(f, url(f));
    };
    input.click();
  };
  const addFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = () => {
      const list = Array.from(input.files ?? []).map((f) => ({
        name: f.name,
        url: url(f),
        type: f.type,
        size: f.size,
        blob: f,
      }));
      if (list.length) {
        const next = [...list, ...files];
        setFiles(next);
        viewer(next, 0);
      }
    };
    input.click();
  };
  const preview = (cls: string) => (
    <div className={`avatar-preview${cls}`}>
      {avatar ? <img src={avatar} alt="" /> : <MaterialIcon name="person" />}
    </div>
  );
  const yt0 = YT_VIDEOS[0],
    yt1 = YT_VIDEOS[1];

  return (
    <div className="gallery-media">
      <DocPage
        title="Médias"
        icon="perm_media"
        toc={TOC}
        subtitle="Lecture et aperçu de fichiers sans aucune dépendance : vidéo aux contrôles maison, YouTube en mode façade, audio à forme d'onde, PDF, visionneuse universelle, carrousel et recadrage d'image. Tous les médias de démonstration sont générés localement (PDF, WAV, images canvas, vidéo MediaRecorder)."
      >
        <DocSection
          id="video"
          title="Lecteur vidéo"
          source="app-video-player (shared/components/media)"
          cols={2}
          description="Contrôles au thème du kit au-dessus d'un <video> natif : tampon, aperçu du temps au survol, volume, vitesse, sous-titres WebVTT, image dans l'image et plein écran. Raccourcis : Espace/K, J/L (±10 s), ←/→ (±5 s), ↑/↓, M, F, C."
        >
          <Demo label="Avec sous-titres" hint="vidéo enregistrée depuis un canvas" code={CODE.video}>
            {videoState === 'loading' ? (
              <div className="gen-state">
                <MatSpinner diameter={28} />
                <span>Génération de la vidéo de démonstration…</span>
              </div>
            ) : videoState === 'unsupported' ? (
              <VideoPlayer
                src={null}
                emptyLabel="Ce navigateur ne sait pas enregistrer de vidéo depuis un canvas : choisissez un fichier local."
              />
            ) : (
              <VideoPlayer src={videoUrl} title="Trajet CI-4521-AB" tracks={S.subtitles} />
            )}
          </Demo>
          <Demo label="Fichier local" hint="aucun envoi : URL blob">
            <VideoPlayer src={localVideo} poster="assets/bg.jpg" />
            <div className="row demo-actions">
              <Button
                variant="outlined"
                startIcon={<MaterialIcon name="video_file" />}
                onClick={() => pick('video/*', (_f, u) => setLocalVideo(u))}
              >
                Choisir une vidéo
              </Button>
              {localVideo && (
                <Button variant="text" onClick={() => setLocalVideo(null)}>
                  Retirer
                </Button>
              )}
            </div>
          </Demo>
          <Demo label="États">
            <div className="grid-2">
              <VideoPlayer src={null} />
              <VideoPlayer src="data:video/mp4;base64,AAAA" />
            </div>
            <span className="caption">Vide · Format non lisible</span>
          </Demo>
          <Demo label="Format vertical (9:16)">
            <div className="vertical">
              {videoUrl ? (
                <VideoPlayer src={videoUrl} aspectRatio="9 / 16" loop />
              ) : (
                <VideoPlayer src={null} aspectRatio="9 / 16" />
              )}
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="youtube"
          title="Lecteur YouTube"
          source="app-youtube-player (shared/components/media)"
          cols={2}
          description="Mode « façade » : seule la miniature est affichée ; l'iframe youtube-nocookie n'est chargée qu'au clic (page plus légère, pas de cookie avant interaction). Accepte une URL (watch, youtu.be, shorts, embed) ou un identifiant. Seul composant du kit à contacter un service externe, et uniquement à la demande."
        >
          <Demo label="Façade (par défaut)" code={CODE.youtube}>
            <YoutubePlayer video={yt0.id} title={yt0.title} duration={yt0.duration} />
          </Demo>
          <Demo label="Contrôles externes + événements" hint="API postMessage de l'embed">
            <YoutubePlayer
              video={yt1.id}
              title={yt1.title}
              duration={yt1.duration}
              controls
              start={60}
              onStateChange={(e) => logYt(e === 'playing' ? 'lecture' : e === 'paused' ? 'pause' : 'terminée')}
            />
            {ytEvents.length > 0 && (
              <ul className="event-log">
                {ytEvents.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </Demo>
          <Demo label="Depuis une URL saisie">
            <div className="form-field">
              <label className="field-label">URL YouTube</label>
              <div className="field-box">
                <MaterialIcon name="smart_display" />
                <input
                  value={ytInput}
                  onChange={(e) => setYtInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadYt();
                  }}
                  placeholder="https://youtu.be/…"
                />
                <IconButton type="button" onClick={loadYt}>
                  <MaterialIcon name="arrow_forward" />
                </IconButton>
              </div>
            </div>
            <YoutubePlayer className="mt" video={ytCurrent} />
          </Demo>
          <Demo label="Liste de vidéos (tutoriels)">
            <div className="yt-list">
              {YT_VIDEOS.map((v) => (
                <YoutubePlayer key={v.id} video={v.id} title={v.title} duration={v.duration} />
              ))}
              <YoutubePlayer video="lien-invalide" />
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="audio"
          title="Lecteur audio"
          source="app-audio-player (shared/components/media)"
          cols={2}
          description="Forme d'onde calculée localement (Web Audio) et cliquable pour se positionner ; ←/→ au clavier. Trois variantes : carte, note vocale compacte et playlist avec enchaînement automatique."
        >
          <Demo label="Par défaut" code={CODE.audio}>
            <AudioPlayer tracks={firstTrack} />
          </Demo>
          <Demo label="Note vocale (compact)" hint='variant="compact"'>
            <div className="chat">
              <div className="bubble in">
                <span>Bonjour, le véhicule CI-4521-AB ne remonte plus depuis ce matin.</span>
              </div>
              <AudioPlayer tracks={voice} variant="compact" />
              <div className="bubble in">
                <span>Je passe au dépôt vers 15 h.</span>
              </div>
            </div>
          </Demo>
          <Demo label="Playlist" hint='variant="playlist"'>
            <AudioPlayer tracks={S.tracks} variant="playlist" />
          </Demo>
          <Demo label="Vide">
            <AudioPlayer tracks={[]} />
          </Demo>
        </DocSection>

        <DocSection
          id="pdf"
          title="Lecteur PDF"
          source="app-pdf-viewer (shared/components/media)"
          description="Rendu par le moteur PDF natif du navigateur, piloté par une barre d'outils maison : sommaire des pages, saisie de page, zoom, impression, téléchargement, plein écran. Sur les navigateurs sans lecteur intégré (mobiles), affiche un repli « Ouvrir / Télécharger »."
        >
          <Demo label="Document multi-pages" hint="PDF de 4 pages généré en TypeScript" code={CODE.pdf} flush>
            <PdfViewer src={S.pdfUrl} blob={S.pdfBlob} name="contrat-cadre-2026.pdf" height="640px" />
          </Demo>
          <div className="grid-2">
            <Demo label="Fichier local">
              <PdfViewer
                src={localPdf?.url ?? null}
                blob={localPdf?.blob ?? null}
                name={localPdf?.name ?? 'document.pdf'}
                height="380px"
              />
              <div className="row demo-actions">
                <Button
                  variant="outlined"
                  startIcon={<MaterialIcon name="upload_file" />}
                  onClick={() => pick('application/pdf', (f, u) => setLocalPdf({ url: u, name: f.name, blob: f }))}
                >
                  Choisir un PDF
                </Button>
              </div>
            </Demo>
            <Demo label="Vide">
              <PdfViewer src={null} name="Aucun document" height="380px" />
            </Demo>
          </div>
        </DocSection>

        <DocSection
          id="viewer"
          title="Visionneuse de fichiers"
          source="FileViewerService.open(files, index)"
          description="Une seule modale plein écran pour tous les types : image (zoom molette / double-clic, glisser, rotation), PDF, vidéo, audio, texte, sinon « aperçu indisponible » avec téléchargement. Navigation ←/→ et bandeau de vignettes. Se combine avec app-file-upload."
        >
          <Demo label="Pièces jointes" code={CODE.viewer}>
            <div className="attachments">
              {files.map((f, i) => (
                <button key={f.url} type="button" className="attachment" onClick={() => viewer(files, i)}>
                  {f.type?.startsWith('image/') ? (
                    <img src={f.url} alt="" />
                  ) : (
                    <span className="att-icon" data-kind={iconOf(f)}>
                      <MaterialIcon name={iconOf(f)} />
                    </span>
                  )}
                  <span className="att-meta">
                    <strong>{f.name}</strong>
                    <span>{formatBytes(f.size ?? 0)}</span>
                  </span>
                </button>
              ))}
              <button type="button" className="attachment add" onClick={addFiles}>
                <MaterialIcon name="add" />
                <span>Ouvrir des fichiers locaux</span>
              </button>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="carousel"
          title="Carrousel"
          source="app-carousel (shared/components/media)"
          cols={2}
          description="Images ou contenu libre via <ng-template #slide let-item>. Défilement automatique (pause au survol, onglet masqué ou bouton), boucle, glisser au doigt / à la souris, clavier ←/→, points ou vignettes, plusieurs éléments visibles."
        >
          <Demo label="Autoplay + points" hint='[autoplay]="4000"' code={CODE.carousel}>
            <Carousel items={S.slides} autoplay={4000} />
          </Demo>
          <Demo label="Galerie à vignettes" hint='indicators="thumbs"'>
            <Carousel items={S.slides} indicators="thumbs" loop={false} />
          </Demo>
          <Demo label="Plusieurs éléments + contenu libre" hint='[perView]="3"' code={CODE.carouselTpl}>
            <Carousel
              items={CARDS}
              perView={3}
              loop={false}
              renderSlide={(item) => (
                <div className="product" data-tone={item.tone}>
                  <MaterialIcon name={item.icon} />
                  <strong>{item.title}</strong>
                  <span>{item.price}</span>
                </div>
              )}
            />
          </Demo>
          <Demo label="Bannière (format large)">
            <Carousel items={S.slides.slice(1, 4)} aspectRatio="21 / 7" arrows={false} autoplay={3000} />
          </Demo>
        </DocSection>

        <DocSection
          id="image-gallery"
          title="Galerie d'images"
          source="app-image-gallery (shared/components/media)"
          description="Trois dispositions : grille régulière (vignettes recadrées), lignes justifiées (proportions respectées, hauteur de ligne homogène, recalculée à la largeur) et masonry. Filtres par catégorie, légende au survol, sélection multiple (case à cocher ou Ctrl/⌘+clic), « Afficher plus », ouverture dans la visionneuse plein écran (zoom, rotation, ←/→)."
        >
          <Demo
            label="Lignes justifiées + filtres + sélection"
            hint="changez la disposition en haut à droite"
            code={CODE.imageGallery}
          >
            <ImageGallery
              images={S.gallery}
              layout="justified"
              rowHeight={190}
              filters
              switcher
              selectable
              pageSize={10}
              onSelectionChange={setSelectedImages}
              selectionActions={
                <>
                  <Button variant="outlined" startIcon={<MaterialIcon name="download" />}>
                    Télécharger ({selectedImages.length})
                  </Button>
                  <Button variant="outlined" startIcon={<MaterialIcon name="delete_outline" />}>
                    Supprimer
                  </Button>
                </>
              }
            />
          </Demo>
          <div className="grid-2">
            <Demo label="Grille carrée" hint='layout="grid"'>
              <ImageGallery images={S.gallery.slice(0, 8)} layout="grid" minWidth={120} gap={6} />
            </Demo>
            <Demo label="Grille 16:9" hint={'[aspectRatio]="\'16 / 9\'"'}>
              <ImageGallery
                images={S.gallery.slice(4, 10)}
                layout="grid"
                minWidth={160}
                aspectRatio="16 / 9"
                gap={10}
              />
            </Demo>
          </div>
        </DocSection>

        <DocSection
          id="video-gallery"
          title="Galerie vidéo"
          source="app-video-gallery (shared/components/media)"
          description="Vidéos locales (miniature extraite automatiquement de la vidéo) et YouTube (mode façade) mélangées. Mode grille : lecture dans une modale avec précédent / suivant. Mode cinéma : grand lecteur et playlist « À suivre », enchaînement automatique à la fin d'une vidéo locale."
        >
          {videoGenerating && (
            <div className="gen-inline">
              <MatSpinner diameter={18} />
              Génération des vidéos de démonstration…
            </div>
          )}
          <Demo label="Mode cinéma + playlist" hint='layout="theater"' code={CODE.videoGallery}>
            <VideoGallery videos={videoItems} layout="theater" filters />
          </Demo>
          <Demo label="Mode grille" hint="clic → lecture en modale">
            <VideoGallery videos={videoItems} layout="grid" minCardWidth={220} />
          </Demo>
        </DocSection>

        <DocSection
          id="masonry"
          title="Grille masonry"
          source="app-masonry-grid (shared/components/media)"
          description="Cartes de hauteurs différentes empilées sans trous, en gardant l'ordre de lecture gauche → droite. Contenu libre via <ng-template #item>, colonnes responsives (largeur minimale) ou nombre fixe ; les hauteurs sont remesurées automatiquement (chargement d'images, redimensionnement)."
        >
          <Demo label="Cartes d'activité" code={CODE.masonry}>
            <div className="row mason-ctrl">
              <span className="muted">Colonnes :</span>
              <ToggleButtonGroup
                exclusive
                value={masonryCols ?? 'auto'}
                onChange={(_, v: number | 'auto' | null) => {
                  if (v !== null) setMasonryCols(v === 'auto' ? null : v);
                }}
                className="m3-segmented"
              >
                {(['auto', 2, 3, 4] as const).map((v) => (
                  <ToggleButton key={v} value={v}>
                    {(masonryCols ?? 'auto') === v && <MaterialIcon name="check" className="seg-check" />}
                    {v === 'auto' ? 'Auto' : v}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>
            <MasonryGrid
              items={MASONRY_NOTES}
              minColumnWidth={230}
              columns={masonryCols}
              renderItem={(n) => (
                <article className="mnote" data-tone={n.tone}>
                  <header>
                    <span className="mn-ic">
                      <MaterialIcon name={n.icon} />
                    </span>
                    <strong>{n.t}</strong>
                  </header>
                  <p>{n.d}</p>
                  {n.tags.length > 0 && (
                    <footer>
                      {n.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </footer>
                  )}
                </article>
              )}
            />
          </Demo>
          <Demo label="Images (proportions d'origine)">
            <MasonryGrid
              items={masonryImages}
              minColumnWidth={180}
              gap={10}
              renderItem={(img, i) => (
                <figure
                  className="mimg"
                  onClick={() =>
                    viewer(
                      masonryImages.map((m) => ({ name: m.name ?? 'image.jpg', url: m.url, type: 'image/jpeg' })),
                      i,
                    )
                  }
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    style={{ aspectRatio: `${img.width} / ${img.height}` }}
                    loading="lazy"
                  />
                  <figcaption>{img.title}</figcaption>
                </figure>
              )}
            />
          </Demo>
        </DocSection>

        <DocSection
          id="cropper"
          title="Recadrage d'image / avatar"
          source="app-image-cropper (shared/components/media)"
          cols={2}
          description="Recadrage 100 % local sur canvas : glisser pour cadrer, molette ou curseur pour zoomer, rotation par 90°. Cadre rond pour les avatars ou rectangulaire au ratio voulu. Complète le champ « Photo » d'app-file-upload."
        >
          <Demo label="Avatar (cadre rond)" code={CODE.cropper}>
            <ImageCropper src={cropSrc} round onCropped={setAvatar} onCancel={() => setAvatar(null)} />
            <div className="crop-result">
              {preview(' lg')}
              {preview('')}
              {preview(' sm')}
              <span className="spacer" />
              <Button
                variant="outlined"
                startIcon={<MaterialIcon name="image" />}
                onClick={() => pick('image/*', (_f, u) => setCropSrc(u))}
              >
                Autre image
              </Button>
            </div>
          </Demo>
          <Demo label="Bannière 16:9" hint='[aspect]="16/9"'>
            <ImageCropper
              src={cropSrc}
              aspect={16 / 9}
              frameSize={300}
              outputWidth={1280}
              format="image/jpeg"
              onCropped={setBanner}
              onCancel={() => setBanner(null)}
            />
            {banner && <img className="banner-result" src={banner} alt="Bannière recadrée" />}
          </Demo>
        </DocSection>
      </DocPage>
    </div>
  );
}
