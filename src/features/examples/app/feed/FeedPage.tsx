import { Button, CircularProgress, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { useRef, useState, type CSSProperties } from 'react';
import { CommentComposer } from '../../../../components/content/CommentComposer';
import { CommentThread } from '../../../../components/content/CommentThread';
import type { CommentAuthor, CommentItem } from '../../../../components/content/contentModels';
import { useDialog } from '../../../../components/feedback/dialogs/useDialog';
import { MapView } from '../../../../components/map/MapView';
import type { MapMarker } from '../../../../components/map/mapModels';
import { AudioPlayer } from '../../../../components/media/AudioPlayer';
import { Carousel } from '../../../../components/media/Carousel';
import { useFileViewer } from '../../../../components/media/FileViewer';
import type { AudioTrack, CarouselSlide } from '../../../../components/media/mediaTypes';
import { VideoPlayer } from '../../../../components/media/VideoPlayer';
import { YoutubePlayer } from '../../../../components/media/YoutubePlayer';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { ARTICLES, FEED_COMMENTS, ME, PEOPLE } from '../../../../data/static/content.data';
import { markdownInline } from '../../../../lib/markdown';
import { initials } from '../../exUtils';
import { FILE_ICON_BASE, FM_KINDS, exFiles, fmSize, useExFiles, type FmItem } from '../files/exFilesStore';
import { openFilePicker } from '../files/FilePickerDialog';
import '../../ex-page.scss';
import './feed.scss';

/** Bloc média d'une publication (une publication peut en cumuler plusieurs). */
type Media =
  | { kind: 'photos'; items: FmItem[] }
  | { kind: 'album'; title: string; slides: CarouselSlide[] }
  /** `ref` : vidéo du disque résolue à l'affichage (enregistrée en tâche de fond). */
  | { kind: 'video'; title: string; item?: FmItem; ref?: 'sample' }
  | { kind: 'youtube'; id: string; title: string; duration: string }
  | { kind: 'voice' | 'podcast'; tracks: AudioTrack[] }
  | { kind: 'document'; item: FmItem; pages?: number }
  | { kind: 'files'; items: FmItem[] }
  | {
      kind: 'link';
      url: string;
      domain: string;
      title: string;
      description: string;
      icon: string;
      hue: number;
      internal?: boolean;
    }
  | { kind: 'place'; name: string; address: string; markers: MapMarker[]; center: [number, number] }
  | { kind: 'poll'; question: string; options: { label: string; votes: number }[]; voted?: number };

type MediaFilter = 'all' | 'photos' | 'video' | 'audio' | 'docs' | 'links' | 'places';

interface Post {
  id: string;
  author: CommentAuthor;
  at: string;
  text: string;
  likes: number;
  liked?: boolean;
  saved?: boolean;
  media: Media[];
  comments: CommentItem[];
  open?: boolean;
}

const FILTERS: { id: MediaFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'Tout', icon: 'dynamic_feed' },
  { id: 'photos', label: 'Photos', icon: 'photo_library' },
  { id: 'video', label: 'Vidéos', icon: 'smart_display' },
  { id: 'audio', label: 'Audio', icon: 'graphic_eq' },
  { id: 'docs', label: 'Documents', icon: 'description' },
  { id: 'links', label: 'Liens', icon: 'link' },
  { id: 'places', label: 'Lieux', icon: 'place' },
];
const MATCH: Record<MediaFilter, (m: Media) => boolean> = {
  all: () => true,
  photos: (m) => m.kind === 'photos' || m.kind === 'album',
  video: (m) => m.kind === 'video' || m.kind === 'youtube',
  audio: (m) => m.kind === 'voice' || m.kind === 'podcast',
  docs: (m) => m.kind === 'document' || m.kind === 'files',
  links: (m) => m.kind === 'link',
  places: (m) => m.kind === 'place',
};
const EVENTS = [
  { d: '21', m: 'oct.', t: 'Atelier produit', s: 'Salle Lagune · 10 h' },
  { d: '24', m: 'oct.', t: 'Inauguration Vridi', s: 'Entrepôt · 16 h 30' },
  { d: '03', m: 'nov.', t: 'Revue trimestrielle', s: 'En ligne · 9 h' },
];
const total = (m: Media) => (m.kind === 'poll' ? m.options.reduce((n, o) => n + o.votes, 0) : 0);

/** Publications d'exemple, construites à partir du disque partagé. */
function initialPosts(): Post[] {
  const all = exFiles.getItems();
  const by = (name: string) => all.find((i) => i.name === name);
  const photos = all.filter((i) => i.kind === 'image');
  const wav = all.filter((i) => i.kind === 'audio');
  const [, AYA, MARC, GRACE, IBRAHIM, NADIA] = PEOPLE as [
    CommentAuthor,
    CommentAuthor,
    CommentAuthor,
    CommentAuthor,
    CommentAuthor,
    CommentAuthor,
  ];
  const article = ARTICLES[0];
  const contract = by('Contrat cadre 2026.pdf');
  const posts: (Post | null)[] = [
    {
      id: 'p1',
      author: AYA,
      at: 'il y a 2 h',
      likes: 18,
      open: true,
      comments: FEED_COMMENTS[0] ?? [],
      text: 'Le nouvel entrepôt de **Vridi** est opérationnel ! Merci à toute l’équipe logistique pour ces trois semaines intenses. Les premières livraisons partent lundi.',
      media: [{ kind: 'photos', items: photos.filter((p) => p.parent === 'sotra').concat(photos.slice(0, 2)) }],
    },
    {
      id: 'p2',
      author: MARC,
      at: 'il y a 3 h',
      likes: 24,
      comments: [],
      text: 'Démo du **suivi en temps réel** sur l’axe Abidjan – Yamoussoukro : la trace se met à jour toutes les 5 secondes.',
      media: [{ kind: 'video', title: 'Trajet CI-4521-AB', ref: 'sample' }],
    },
    {
      id: 'p3',
      author: IBRAHIM,
      at: 'il y a 5 h',
      likes: 9,
      comments: FEED_COMMENTS[1] ?? [],
      text: 'Petit sondage pour l’atelier produit de vendredi :',
      media: [
        {
          kind: 'poll',
          question: 'Quel module voulez-vous améliorer en priorité ?',
          options: [
            { label: 'Facturation', votes: 14 },
            { label: 'Planning terrain', votes: 22 },
            { label: 'Application mobile', votes: 9 },
            { label: 'Rapports', votes: 5 },
          ],
        },
      ],
    },
    {
      id: 'p4',
      author: { name: 'Koffi N’Guessan', color: '#0891b2', role: 'Technicien' },
      at: 'il y a 6 h',
      likes: 4,
      comments: [],
      text: 'Note vocale depuis le chantier de San-Pédro 👇',
      media: [{ kind: 'voice', tracks: [{ title: 'Note vocale', src: wav[0]?.url ?? '', blob: wav[0]?.blob }] }],
    },
    contract
      ? {
          id: 'p5',
          author: { name: 'Fatou Diabaté', color: '#7c3aed', role: 'Juridique' },
          at: 'hier',
          likes: 11,
          comments: [],
          text: 'Le **contrat cadre 2026** est signé. Version finale ci-dessous, merci de vous y référer pour les nouvelles commandes.',
          media: [{ kind: 'document', item: contract, pages: 4 }],
        }
      : null,
    article
      ? {
          id: 'p6',
          author: GRACE,
          at: 'hier',
          likes: 31,
          comments: FEED_COMMENTS[2] ?? [],
          text: 'Nouvel article sur le blog. Vos commentaires sont les bienvenus 🙌',
          media: [
            {
              kind: 'link',
              url: '/examples/app/blog/' + article.slug,
              domain: 'scstorage.ci/blog',
              title: article.title,
              description: article.dek,
              icon: article.icon,
              hue: article.hue,
              internal: true,
            },
          ],
        }
      : null,
    {
      id: 'p7',
      author: NADIA,
      at: 'hier',
      likes: 15,
      comments: [],
      text: 'Pour la pause café : un court-métrage libre qui sert de référence pour nos tests vidéo.',
      media: [{ kind: 'youtube', id: 'aqz-KE-bpKQ', title: 'Big Buck Bunny', duration: '10:34' }],
    },
    {
      id: 'p8',
      author: AYA,
      at: 'il y a 2 j',
      likes: 7,
      comments: [],
      text: 'Nous sommes sur place pour l’inventaire annuel. Passez nous voir !',
      media: [
        {
          kind: 'place',
          name: 'Port autonome de San-Pédro',
          address: 'Zone portuaire, San-Pédro',
          center: [4.7485, -6.6363],
          markers: [
            {
              id: 'sp',
              lat: 4.7485,
              lng: -6.6363,
              title: 'Port de San-Pédro',
              icon: 'warehouse',
              tone: 'primary',
              pulse: true,
            },
          ],
        },
      ],
    },
    {
      id: 'p9',
      author: IBRAHIM,
      at: 'il y a 2 j',
      likes: 6,
      comments: [],
      text: 'Documents de préparation de la revue trimestrielle (budget, support et archives 2025).',
      media: [
        {
          kind: 'files',
          items: ['Budget Sotra.xlsx', 'Présentation T4.pptx', 'Clients actifs.csv', 'Archives 2025.zip']
            .map(by)
            .filter((x): x is FmItem => !!x),
        },
      ],
    },
    {
      id: 'p10',
      author: GRACE,
      at: 'il y a 3 j',
      likes: 42,
      comments: [],
      text: 'Album de la **journée d’intégration** — balayez pour tout voir.',
      media: [
        {
          kind: 'album',
          title: 'Journée d’intégration',
          slides: photos
            .slice(0, 7)
            .map((p, i) => ({ url: p.url ?? '', title: p.name.replace('.jpg', ''), caption: `Photo ${i + 1} sur 7` })),
        },
      ],
    },
    {
      id: 'p11',
      author: NADIA,
      at: 'il y a 4 j',
      likes: 13,
      comments: [],
      text: 'Épisode 12 du podcast interne : comment le support a divisé par deux le temps de réponse.',
      media: [
        {
          kind: 'podcast',
          tracks: wav.map((w, i) => ({
            title: i ? 'Bonus — questions de l’équipe' : 'Épisode 12 — Le support en première ligne',
            artist: 'Podcast SC Storage',
            icon: 'podcasts',
            src: w.url ?? '',
            blob: w.blob,
          })),
        },
      ],
    },
  ];
  return posts.filter((p): p is Post => !!p);
}

/**
 * /examples/app/feed — fil d'équipe multimédia : photos (mosaïque + visionneuse), album (carrousel), vidéo,
 * YouTube, note vocale, podcast, PDF, pièces jointes, aperçu de lien, lieu (carte), sondage ; publication avec
 * pièces jointes depuis l'ordinateur ou le sélecteur de fichiers (modale) ; filtres par type de média.
 */
export function FeedPage() {
  const items = useExFiles();
  const viewer = useFileViewer();
  const dialog = useDialog();
  const local = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'all' | 'team' | 'saved'>('all');
  const [filter, setFilter] = useState<MediaFilter>('all');
  /** Pièces jointes du brouillon de publication. */
  const [pending, setPending] = useState<FmItem[]>([]);
  const [pendingPlace, setPendingPlace] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [menu, setMenu] = useState<{ el: HTMLElement; p: Post } | null>(null);
  /** Vidéo d'exemple du disque (disponible quelques secondes après l'ouverture). */
  const sampleVideo = items.find((i) => i.kind === 'video' && i.name.startsWith('Trajet'));

  const visible = posts.filter(
    (p) => (tab !== 'saved' || p.saved) && (filter === 'all' || p.media.some(MATCH[filter])),
  );

  // ─── Publication ───────────────────────────────────────────
  const attachLocal = (files: FileList | null) => {
    if (!files?.length) return;
    const added = exFiles.addFiles(files, null);
    setPending((l) => [...l, ...added]);
  };
  const attachFromDrive = async () => {
    const files = await openFilePicker(dialog, { title: 'Joindre depuis mes fichiers', confirmLabel: 'Joindre' });
    if (files?.length) setPending((l) => [...l, ...files.filter((f) => !l.some((x) => x.id === f.id))]);
  };
  const unattach = (f: FmItem) => setPending((l) => l.filter((x) => x.id !== f.id));

  const publish = (text: string) => {
    const files = pending;
    const media: Media[] = [];
    const imgs = files.filter((f) => f.kind === 'image');
    if (imgs.length) media.push({ kind: 'photos', items: imgs });
    files.filter((f) => f.kind === 'video').forEach((v) => media.push({ kind: 'video', title: v.name, item: v }));
    const audio = files.filter((f) => f.kind === 'audio');
    if (audio.length)
      media.push({
        kind: 'podcast',
        tracks: audio.map((a) => ({ title: a.name, artist: ME.name, src: a.url ?? '', blob: a.blob })),
      });
    files.filter((f) => f.kind === 'pdf').forEach((d) => media.push({ kind: 'document', item: d }));
    const others = files.filter((f) => !['image', 'video', 'audio', 'pdf'].includes(f.kind));
    if (others.length) media.push({ kind: 'files', items: others });
    if (pendingPlace)
      media.push({
        kind: 'place',
        name: 'Siège SC Storage',
        address: 'Immeuble Alpha 2000, Plateau, Abidjan',
        center: [5.3223, -4.0187],
        markers: [
          { id: 'hq', lat: 5.3223, lng: -4.0187, title: 'Siège SC Storage', icon: 'business', tone: 'primary' },
        ],
      });

    setPosts((l) => [
      { id: 'p' + Date.now(), author: ME, at: 'À l’instant', text, likes: 0, comments: [], media },
      ...l,
    ]);
    setPending([]);
    setPendingPlace(false);
    setFilter('all');
  };

  // ─── Interactions ──────────────────────────────────────────
  const update = (id: string, fn: (p: Post) => Post) => setPosts((l) => l.map((p) => (p.id === id ? fn(p) : p)));
  const like = (p: Post) => update(p.id, (x) => ({ ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) }));
  const save = (p: Post) => update(p.id, (x) => ({ ...x, saved: !x.saved }));
  const toggleComments = (p: Post) => update(p.id, (x) => ({ ...x, open: !x.open }));
  const vote = (p: Post, i: number) =>
    update(p.id, (x) => ({
      ...x,
      media: x.media.map((m) =>
        m.kind === 'poll' && m.voted === undefined
          ? { ...m, voted: i, options: m.options.map((o, j) => (j === i ? { ...o, votes: o.votes + 1 } : o)) }
          : m,
      ),
    }));

  /** Ouvre la visionneuse plein écran sur une série de fichiers. */
  const view = (list: FmItem[], index: number) => {
    const ok = list.filter((i) => i.url);
    const target = list[index];
    if (!target?.url) return;
    viewer(exFiles.toViewer(ok), ok.indexOf(target));
  };
  const videoOf = (m: Extract<Media, { kind: 'video' }>) => m.item ?? (m.ref ? sampleVideo : undefined);

  const renderMedia = (p: Post, m: Media, key: number) => {
    switch (m.kind) {
      case 'photos': {
        const list = m.items;
        return (
          <div key={key} className="mosaic" data-n={list.length > 4 ? 4 : list.length}>
            {list.slice(0, 4).map((img, i) => (
              <button
                key={img.id}
                type="button"
                className="tile"
                onClick={() => view(list, i)}
                aria-label={'Agrandir ' + img.name}
              >
                <img src={img.url} alt={img.name} loading="lazy" />
                {i === 3 && list.length > 4 && <span className="more">+{list.length - 4}</span>}
              </button>
            ))}
          </div>
        );
      }
      case 'album':
        return (
          <div key={key} className="album">
            <Carousel items={m.slides} indicators="thumbs" aspectRatio="16 / 10" />
          </div>
        );
      case 'video': {
        const v = videoOf(m);
        return (
          <div key={key} className="video">
            {v?.url ? (
              <VideoPlayer src={v.url} />
            ) : (
              <div className="video-wait">
                <CircularProgress size={28} />
                <span>Préparation de la vidéo…</span>
              </div>
            )}
          </div>
        );
      }
      case 'youtube':
        return (
          <div key={key} className="video">
            <YoutubePlayer video={m.id} title={m.title} duration={m.duration} />
          </div>
        );
      case 'voice':
        return (
          <div key={key} className="voice">
            <AudioPlayer tracks={m.tracks} variant="compact" />
          </div>
        );
      case 'podcast':
        return (
          <div key={key} className="podcast">
            <AudioPlayer tracks={m.tracks} variant={m.tracks.length > 1 ? 'playlist' : 'default'} />
          </div>
        );
      case 'document': {
        const d = m.item;
        return (
          <button key={key} type="button" className="doc" onClick={() => view([d], 0)}>
            <span className="doc-cover">
              <MaterialIcon name="picture_as_pdf" />
              <span className="lines">
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
            <span className="doc-info">
              <strong>{d.name}</strong>
              <small>
                PDF · {m.pages ?? 1} page(s) · {fmSize(d.size)}
              </small>
            </span>
            <span className="doc-open">
              <MaterialIcon name="open_in_full" />
              Ouvrir
            </span>
          </button>
        );
      }
      case 'files':
        return (
          <div key={key} className="files">
            {m.items.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className="file"
                onClick={() => view(m.items, i)}
                disabled={!f.url}
                title={f.url ? 'Aperçu' : 'Aperçu indisponible'}
              >
                <img src={FILE_ICON_BASE + FM_KINDS[f.kind].img} alt="" />
                <span>
                  <strong>{f.name}</strong>
                  <small>
                    {FM_KINDS[f.kind].label} · {fmSize(f.size)}
                  </small>
                </span>
                <MaterialIcon name={f.url ? 'visibility' : 'download'} />
              </button>
            ))}
          </div>
        );
      case 'link':
        return (
          <a key={key} className="link" href={m.url} style={{ '--h': m.hue } as CSSProperties}>
            <span className="l-art">
              <MaterialIcon name={m.icon} />
            </span>
            <span className="l-body">
              <small>{m.domain}</small>
              <strong>{m.title}</strong>
              <span>{m.description}</span>
            </span>
          </a>
        );
      case 'place':
        return (
          <div key={key} className="place">
            <MapView
              center={m.center}
              zoom={13}
              height="200px"
              markers={m.markers}
              fitBounds={false}
              interactive={false}
              zoomControl={false}
            />
            <div className="pl-foot">
              <MaterialIcon name="place" />
              <span>
                <strong>{m.name}</strong>
                <small>{m.address}</small>
              </span>
              <Button variant="outlined" color="inherit">
                Itinéraire
              </Button>
            </div>
          </div>
        );
      case 'poll': {
        const t = total(m);
        return (
          <div key={key} className="poll" role="group" aria-label={m.question}>
            <strong>{m.question}</strong>
            {m.options.map((o, i) =>
              m.voted === undefined ? (
                <button key={o.label} type="button" className="opt" onClick={() => vote(p, i)}>
                  <span className="radio" />
                  {o.label}
                </button>
              ) : (
                <div key={o.label} className={`res${m.voted === i ? ' mine' : ''}`}>
                  <span className="bar" style={{ width: (o.votes / t) * 100 + '%' }} />
                  <span className="lbl">
                    {o.label}
                    {m.voted === i && <MaterialIcon name="check_circle" />}
                  </span>
                  <b>{Math.round((o.votes / t) * 100)} %</b>
                </div>
              ),
            )}
            <small>{t} votes · se termine dans 2 jours</small>
          </div>
        );
      }
    }
  };

  return (
    <div className="ex-page ex-feed">
      <div className="layout">
        <aside className="left">
          <section className="card profile">
            <div className="cover" />
            <span className="ava big" style={{ background: ME.color }}>
              {initials(ME.name)}
            </span>
            <strong>{ME.name}</strong>
            <small>{ME.role} · SC Storage</small>
            <div className="stats">
              <div>
                <b>42</b>
                <span>publications</span>
              </div>
              <div>
                <b>318</b>
                <span>abonnés</span>
              </div>
              <div>
                <b>27</b>
                <span>équipes</span>
              </div>
            </div>
          </section>
          <nav className="card menu">
            <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>
              <MaterialIcon name="dynamic_feed" />
              Tout le fil
            </button>
            <button className={tab === 'team' ? 'on' : ''} onClick={() => setTab('team')}>
              <MaterialIcon name="groups" />
              Mon équipe
            </button>
            <button className={tab === 'saved' ? 'on' : ''} onClick={() => setTab('saved')}>
              <MaterialIcon name="bookmark" />
              Enregistrés
            </button>
          </nav>
        </aside>

        <main className="feed">
          {/* Nouvelle publication */}
          <section className="card new-post">
            <CommentComposer
              author={ME}
              mentionables={PEOPLE}
              placeholder="Partagez une info avec l’équipe…"
              submitLabel="Publier"
              maxLength={600}
              onSubmit={publish}
            />
            {(pending.length > 0 || pendingPlace) && (
              <div className="pending">
                {pending.map((f) => (
                  <span key={f.id} className="pj">
                    {f.kind === 'image' && f.url ? (
                      <img src={f.url} alt="" />
                    ) : (
                      <img className="ic" src={FILE_ICON_BASE + FM_KINDS[f.kind].img} alt="" />
                    )}
                    <span className="pj-txt">
                      <strong>{f.name}</strong>
                      <small>{fmSize(f.size)}</small>
                    </span>
                    <button type="button" onClick={() => unattach(f)} aria-label={'Retirer ' + f.name}>
                      <MaterialIcon name="close" />
                    </button>
                  </span>
                ))}
                {pendingPlace && (
                  <span className="pj">
                    <MaterialIcon name="place" className="pin" />
                    <span className="pj-txt">
                      <strong>Siège SC Storage</strong>
                      <small>Plateau, Abidjan</small>
                    </span>
                    <button type="button" onClick={() => setPendingPlace(false)} aria-label="Retirer le lieu">
                      <MaterialIcon name="close" />
                    </button>
                  </span>
                )}
              </div>
            )}
            <div className="attach">
              <Button onClick={() => local.current?.click()} startIcon={<MaterialIcon name="add_photo_alternate" />}>
                Photo / vidéo
              </Button>
              <input
                ref={local}
                type="file"
                hidden
                multiple
                accept="image/*,video/*,audio/*,application/pdf"
                onChange={(e) => {
                  attachLocal(e.target.files);
                  e.target.value = '';
                }}
              />
              <Button onClick={() => void attachFromDrive()} startIcon={<MaterialIcon name="folder_open" />}>
                Mes fichiers
              </Button>
              <Button
                onClick={() => setPendingPlace(true)}
                disabled={pendingPlace}
                startIcon={<MaterialIcon name="add_location_alt" />}
              >
                Lieu
              </Button>
            </div>
          </section>

          {/* Filtres par type de média */}
          <div className="filters" role="tablist" aria-label="Filtrer par type de média">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                className={`chip-filter${filter === f.id ? ' on' : ''}`}
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                <MaterialIcon name={f.icon} />
                {f.label}
              </button>
            ))}
          </div>

          {visible.map((p) => (
            <article key={p.id} className="card post">
              <header>
                <span className="ava" style={{ background: p.author.color }}>
                  {initials(p.author.name)}
                </span>
                <div className="who">
                  <strong>{p.author.name}</strong>
                  <small>
                    {p.author.role} · {p.at} · <MaterialIcon name="public" />
                  </small>
                </div>
                <IconButton aria-label="Options" onClick={(e) => setMenu({ el: e.currentTarget, p })}>
                  <MaterialIcon name="more_horiz" />
                </IconButton>
              </header>
              <p className="text" dangerouslySetInnerHTML={{ __html: markdownInline(p.text) }} />

              {p.media.map((m, i) => renderMedia(p, m, i))}

              <div className="counts">
                <span>
                  <i className="heart">
                    <MaterialIcon name="favorite" />
                  </i>
                  {p.likes}
                </span>
                <button type="button" onClick={() => toggleComments(p)}>
                  {p.comments.length} commentaire(s)
                </button>
              </div>
              <footer>
                <button type="button" className={p.liked ? 'on' : ''} onClick={() => like(p)}>
                  <MaterialIcon name={p.liked ? 'favorite' : 'favorite_border'} />
                  J’aime
                </button>
                <button type="button" onClick={() => toggleComments(p)}>
                  <MaterialIcon name="chat_bubble_outline" />
                  Commenter
                </button>
                <button type="button" className={p.saved ? 'saved' : ''} onClick={() => save(p)}>
                  <MaterialIcon name={p.saved ? 'bookmark' : 'bookmark_border'} />
                  Enregistrer
                </button>
              </footer>

              {p.open && (
                <div className="post-comments">
                  <CommentThread comments={p.comments} me={ME} mentionables={PEOPLE} compact />
                </div>
              )}
            </article>
          ))}
          {visible.length === 0 && (
            <div className="card empty">
              <MaterialIcon name={tab === 'saved' ? 'bookmark_border' : 'filter_alt_off'} />
              <strong>{tab === 'saved' ? 'Aucune publication enregistrée' : 'Aucune publication de ce type'}</strong>
              <span>
                {tab === 'saved' ? 'Enregistrez une publication pour la retrouver ici.' : 'Essayez un autre filtre.'}
              </span>
            </div>
          )}
        </main>

        <aside className="right">
          <section className="card">
            <h3>Événements à venir</h3>
            {EVENTS.map((e) => (
              <div key={e.t} className="event">
                <span className="date">
                  <b>{e.d}</b>
                  {e.m}
                </span>
                <span>
                  <strong>{e.t}</strong>
                  <small>{e.s}</small>
                </span>
              </div>
            ))}
          </section>
          <section className="card">
            <h3>Collègues</h3>
            {PEOPLE.slice(1, 5).map((u) => (
              <div key={u.name} className="mate">
                <span className="ava" style={{ background: u.color }}>
                  {initials(u.name)}
                </span>
                <span>
                  <strong>{u.name}</strong>
                  <small>{u.role}</small>
                </span>
                <IconButton aria-label="Message">
                  <MaterialIcon name="chat" />
                </IconButton>
              </div>
            ))}
          </section>
        </aside>
      </div>

      <Menu
        anchorEl={menu?.el}
        open={!!menu}
        onClose={() => setMenu(null)}
        slotProps={{ paper: { className: 'm3-dropdown-menu' } }}
      >
        {menu && [
          <MenuItem
            key="save"
            onClick={() => {
              save(menu.p);
              setMenu(null);
            }}
          >
            <ListItemIcon>
              <MaterialIcon name={menu.p.saved ? 'bookmark_remove' : 'bookmark_add'} />
            </ListItemIcon>
            {menu.p.saved ? 'Retirer des enregistrés' : 'Enregistrer'}
          </MenuItem>,
          <MenuItem key="link" onClick={() => setMenu(null)}>
            <ListItemIcon>
              <MaterialIcon name="link" />
            </ListItemIcon>
            Copier le lien
          </MenuItem>,
          <MenuItem key="mute" onClick={() => setMenu(null)}>
            <ListItemIcon>
              <MaterialIcon name="notifications_off" />
            </ListItemIcon>
            Ne plus suivre
          </MenuItem>,
        ]}
      </Menu>
    </div>
  );
}
