import { useState } from 'react';
import { Link } from 'react-router';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DocPage } from '../doc/Doc';
import { DeviceFrame } from './DeviceFrame';
import { DEVICES, DEVICE_SPECS } from './deviceSpecs';
import { SHOWCASES, SHOWCASE_GROUPS, type DeviceKind } from './showcases.data';
import './showcases-gallery.scss';

/** /showcases — tous les écrans autonomes du kit, en vignettes vivantes (iframes chargées à la demande). */
export function ShowcasesGalleryPage() {
  /** Appareil des vignettes (le visionneur s'ouvre sur le même). */
  const [device, setDevice] = useState<DeviceKind>('desktop');
  const [groupFilter, setGroupFilter] = useState('');

  const groups = SHOWCASE_GROUPS.filter((g) => !groupFilter || g.id === groupFilter).map((g) => ({
    ...g,
    items: SHOWCASES.filter((s) => s.group === g.id),
  }));
  const toc = groups.map((g) => ({ id: g.id, label: `${g.label} (${g.items.length})` }));

  return (
    <DocPage
      title="Showcases"
      icon="devices"
      eyebrow="Catalogue"
      className="showcases-gallery"
      toc={toc}
      subtitle="Les sous-modules et des écrans d’exemple, présentés en direct dans une iframe et un cadre d’appareil. Ouvrez une vignette pour basculer entre ordinateur, tablette et mobile, pivoter l’écran et naviguer dans la page."
    >
      <div className="filters">
        <div className="segmented" role="radiogroup" aria-label="Appareil des vignettes">
          {DEVICES.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={device === d}
              className={device === d ? 'on' : ''}
              onClick={() => setDevice(d)}
            >
              <MaterialIcon name={DEVICE_SPECS[d].icon} />
              <span>{DEVICE_SPECS[d].label}</span>
            </button>
          ))}
        </div>
        <div className="group-chips">
          <button type="button" className={!groupFilter ? 'active' : ''} onClick={() => setGroupFilter('')}>
            Tout ({SHOWCASES.length})
          </button>
          {SHOWCASE_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={groupFilter === g.id ? 'active' : ''}
              onClick={() => setGroupFilter(g.id)}
            >
              <MaterialIcon name={g.icon} />
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.id} className="group" id={g.id}>
          <div className="group-head">
            <div className="g-icon">
              <MaterialIcon name={g.icon} />
            </div>
            <div className="g-text">
              <h2>{g.label}</h2>
              <p>{g.description}</p>
            </div>
            <span className="g-count">{g.items.length}</span>
          </div>
          <div className={`grid on-${device}`}>
            {g.items.map((s) => (
              <Link key={s.id} className="card" to={{ pathname: `/showcases/${s.id}`, search: `?device=${device}` }}>
                <div className="thumb">
                  <DeviceFrame src={s.path} device={device} thumbnail title={s.label} />
                  <span className="open">
                    <MaterialIcon name="fullscreen" />
                    Ouvrir l’aperçu
                  </span>
                </div>
                <div className="body">
                  <div className="title">
                    <MaterialIcon name={s.icon} />
                    <strong>{s.label}</strong>
                  </div>
                  <p>{s.description}</p>
                  <div className="tags">
                    {(s.tags ?? []).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </DocPage>
  );
}
