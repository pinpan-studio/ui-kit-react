import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { MaterialIcon } from '../ui/MaterialIcon';
import { Kbd } from './Kbd';

export interface ContextMenuItem {
  id?: string;
  label?: string;
  icon?: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  header?: string;
  action?: () => void;
}

function Panel({
  items,
  x,
  y,
  focusFirst,
  onPick,
  onClose,
}: {
  items: ContextMenuItem[];
  x: number;
  y: number;
  focusFirst: boolean;
  onPick: (it: ContextMenuItem) => void;
  onClose: () => void;
}) {
  const focusable = items.map((it, i) => (!it.divider && !it.header && !it.disabled ? i : -1)).filter((i) => i >= 0);
  const [active, setActive] = useState(focusFirst ? (focusable[0] ?? -1) : -1);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const m = 8;
    setPos({
      left: x + r.width + m > window.innerWidth ? Math.max(m, x - r.width) : x,
      top: y + r.height + m > window.innerHeight ? Math.max(m, y - r.height) : y,
    });
    el.focus();
  }, [x, y]);
  useEffect(() => {
    const down = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const scroll = () => onClose();
    document.addEventListener('pointerdown', down, true);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [onClose]);

  const move = (d: number) => {
    if (!focusable.length) return;
    const cur = focusable.indexOf(active);
    setActive(focusable[(cur + d + focusable.length) % focusable.length] ?? -1);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const it = items[active];
      if (it && !it.disabled) onPick(it);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', zIndex: 1300, ...pos }}>
      <div className="kit-ctx" role="menu" tabIndex={-1} ref={ref} onKeyDown={onKey}>
        {items.map((it, i) =>
          it.divider ? (
            <div key={i} className="ctx-sep" role="separator" />
          ) : it.header ? (
            <div key={i} className="ctx-head">
              {it.header}
            </div>
          ) : (
            <button
              key={i}
              type="button"
              role="menuitem"
              className={`ctx-item${it.danger ? ' danger' : ''}${i === active ? ' active' : ''}`}
              disabled={it.disabled}
              data-i={i}
              onMouseEnter={() => setActive(i)}
              onClick={() => !it.disabled && onPick(it)}
            >
              <MaterialIcon name={it.icon || ''} />
              <span className="ctx-label">{it.label}</span>
              {it.shortcut && <Kbd keys={it.shortcut} />}
            </button>
          ),
        )}
      </div>
    </div>,
    document.body,
  );
}

interface TriggerProps {
  onContextMenu?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
}

/** Menu contextuel (appContextMenu) : clic droit, appui long, touche Menu / Maj+F10, navigation clavier. */
export function ContextMenu({
  items,
  children,
  onOpen,
  onSelect,
}: {
  items: ContextMenuItem[];
  children: ReactElement<TriggerProps>;
  onOpen?: () => void;
  onSelect?: (it: ContextMenuItem) => void;
}) {
  const [at, setAt] = useState<{ x: number; y: number; focus: boolean } | null>(null);
  const press = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => () => clearTimeout(press.current), []);
  const p = children.props;
  const el = (
    <children.type
      {...p}
      onContextMenu={(e: React.MouseEvent) => {
        p.onContextMenu?.(e);
        if (!items.length) return;
        e.preventDefault();
        trigger.current = e.currentTarget as HTMLElement;
        onOpen?.();
        setAt({ x: e.clientX, y: e.clientY, focus: false });
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        p.onKeyDown?.(e);
        if (items.length && (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) {
          e.preventDefault();
          trigger.current = e.currentTarget as HTMLElement;
          const r = trigger.current.getBoundingClientRect();
          onOpen?.();
          setAt({ x: r.left + 16, y: r.top + r.height / 2, focus: true });
        }
      }}
      onTouchStart={(e: React.TouchEvent) => {
        p.onTouchStart?.(e);
        const t = e.touches[0];
        if (!items.length || !t) return;
        press.current = setTimeout(() => {
          onOpen?.();
          setAt({ x: t.clientX, y: t.clientY, focus: false });
        }, 550);
      }}
      onTouchEnd={(e: React.TouchEvent) => (p.onTouchEnd?.(e), clearTimeout(press.current))}
      onTouchMove={(e: React.TouchEvent) => (p.onTouchMove?.(e), clearTimeout(press.current))}
    />
  );
  const close = () => {
    setAt(null);
    trigger.current?.focus?.();
  };
  return (
    <>
      {el}
      {at && (
        <Panel
          items={items}
          x={at.x}
          y={at.y}
          focusFirst={at.focus}
          onClose={close}
          onPick={(it) => {
            setAt(null);
            onSelect?.(it);
            it.action?.();
          }}
        />
      )}
    </>
  );
}
