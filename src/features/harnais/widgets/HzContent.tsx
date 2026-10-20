// Porté depuis ui-kit Angular (harnais/components/widgets/content-widget.component.ts).
import { useState, type CSSProperties } from 'react';
import { ArticleBody } from '../../../components/content/ArticleBody';
import { CommentThread } from '../../../components/content/CommentThread';
import type { CommentItem } from '../../../components/content/contentModels';
import { AuditLog } from '../../../components/data/AuditLog';
import { Barcode, QrCode } from '../../../components/data/QrCode';
import { TextDiff } from '../../../components/data/TextDiff';
import { Banner } from '../../../components/feedback/Banner';
import { Result } from '../../../components/feedback/Result';
import { ME, PEOPLE } from '../../../data/static/content.data';
import type { HarnaisWidget, HzTextVariant } from '../../../data/static/harnais.data';
import './content-widget.scss';

type ContentBlock = Extract<
  HarnaisWidget,
  { type: 'typography' | 'article' | 'comments' | 'qrcode' | 'textdiff' | 'audit' | 'result' | 'banner' }
>;

/** Élément HTML sémantique de chaque style typographique. */
const TAG: Partial<Record<HzTextVariant, string>> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  'page-title': 'h2',
  'card-title': 'h3',
  quote: 'blockquote',
};
const tagOf = (v: HzTextVariant) => TAG[v] ?? 'p';
const toneVar = (tone?: string) =>
  !tone
    ? undefined
    : tone === 'neutral'
      ? 'var(--text-muted)'
      : tone === 'primary'
        ? 'var(--primary-color)'
        : `var(--${tone}-color)`;

/**
 * Widgets de contenu : échelle typographique du kit, article éditorial, fil de commentaires,
 * QR code / code-barres, diff de texte, journal d'audit, écran de résultat, bannière.
 */
export function HzContent({ block: b }: { block: ContentBlock }) {
  /** Fil de commentaires : copie locale pour que réponses et réactions persistent. */
  const [comments, setComments] = useState<CommentItem[]>(() => (b.type === 'comments' ? b.comments : []));

  let body: React.ReactNode = null;
  switch (b.type) {
    case 'typography':
      body = (
        <div className="typo">
          {b.items.map((t, i) => {
            const tag = tagOf(t.variant);
            const Tag = (tag === 'blockquote' ? 'blockquote' : tag) as 'p';
            return (
              <div key={i} className="typo-row">
                <span className="typo-tag">{tag}</span>
                {tag === 'blockquote' ? (
                  <Tag
                    className="quote"
                    style={{ '--tone': toneVar(t.tone) ?? 'var(--primary-color)' } as CSSProperties}
                  >
                    {t.text}
                  </Tag>
                ) : (
                  <Tag className={`text-${t.variant}`} style={{ color: toneVar(t.tone) }}>
                    {t.text}
                  </Tag>
                )}
              </div>
            );
          })}
        </div>
      );
      break;
    case 'article':
      body = <ArticleBody className="article" blocks={b.blocks} size="md" anchors={false} serif={!!b.serif} />;
      break;
    case 'comments':
      body = (
        <CommentThread comments={comments} me={ME} mentionables={PEOPLE} title="" compact onChange={setComments} />
      );
      break;
    case 'qrcode':
      body = (
        <div className="codes">
          <QrCode value={b.value} size={148} caption={b.caption ?? ''} />
          {b.barcode && (
            <div className="barcode">
              <Barcode value={b.barcode} height={52} />
            </div>
          )}
        </div>
      );
      break;
    case 'textdiff':
      body = <TextDiff before={b.before} after={b.after} mode={b.mode ?? 'unified'} />;
      break;
    case 'audit':
      body = <AuditLog entries={b.entries} />;
      break;
    case 'result':
      body = <Result status={b.status} title={b.title ?? ''} subtitle={b.text ?? ''} compact />;
      break;
    case 'banner':
      body = (
        <Banner tone={b.tone} title={b.title ?? ''} icon={b.icon ?? ''} dismissible>
          {b.text}
        </Banner>
      );
      break;
  }
  return <div className="hz-content">{body}</div>;
}
