// Porté depuis ui-kit Angular (harnais/harnais.store.ts) : le service racine devient un store de module,
// lu par les composants via useSyncExternalStore (il survit aux changements de route /harnais ↔ /harnais/:id).
import { useSyncExternalStore } from 'react';
import {
  HARNAIS_ANSWERABLE,
  HARNAIS_CONVERSATIONS,
  type HarnaisAttachment,
  type HarnaisBlock,
  type HarnaisConversation,
  type HarnaisMessage,
  type HzOption,
} from '../../data/static/harnais.data';
import {
  DEMO_CONVERSATION,
  KIT_CONVERSATION,
  TOOLKIT_CONVERSATION,
  answerFollowUp,
  describeValue,
  detectIntent,
  formFollowUp,
  scenarioFor,
  type ScenarioReply,
} from './harnaisScenarios';

export interface HarnaisSendEvent {
  text: string;
  attachments: HarnaisAttachment[];
  extendedThinking: boolean;
  webSearch: boolean;
}

type ToolBlock = Extract<HarnaisBlock, { type: 'tool' }>;

interface HarnaisState {
  conversations: HarnaisConversation[];
  /** Conversation en cours de génération (null = aucune). */
  generatingId: string | null;
}

let state: HarnaisState = {
  conversations: structuredClone([KIT_CONVERSATION, TOOLKIT_CONVERSATION, DEMO_CONVERSATION, ...HARNAIS_CONVERSATIONS]),
  generatingId: null,
};
const listeners = new Set<() => void>();
const setState = (patch: Partial<HarnaisState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let timers: ReturnType<typeof setTimeout>[] = [];

// ─── Mises à jour immuables ──
const patchConversation = (id: string, fn: (c: HarnaisConversation) => HarnaisConversation) =>
  setState({ conversations: state.conversations.map((c) => (c.id === id ? fn(c) : c)) });
const patchMessage = (convId: string, msgId: string, fn: (m: HarnaisMessage) => HarnaisMessage) =>
  patchConversation(convId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)) }));

const tool = (kind: ToolBlock['tool'], label: string, target: string, output: string): ToolBlock => ({
  type: 'tool',
  tool: kind,
  label,
  target,
  status: 'done',
  output,
});
const now = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const thinkingFor = (prompt: string) =>
  `La demande porte sur « ${truncate(prompt, 60)} ». Je rassemble les données utiles, puis je choisis la forme la plus lisible : carte, graphique, tableau, planning ou formulaire si une information me manque.`;

const find = (id: string | null | undefined) => state.conversations.find((c) => c.id === id) ?? null;

const pushUser = (convId: string, text: string) => {
  const msg: HarnaisMessage = {
    id: 'u-' + Date.now().toString(36),
    role: 'user',
    time: now(),
    blocks: [{ type: 'text', text }],
  };
  patchConversation(convId, (c) => ({ ...c, messages: [...c.messages, msg] }));
};

// ─── Simulation : réflexion → outils → texte en flux → widgets → conclusion ──
function run(convId: string, reply: ScenarioReply, e: HarnaisSendEvent) {
  const msgId = 'a-' + Date.now().toString(36);
  patchConversation(convId, (c) => ({
    ...c,
    messages: [...c.messages, { id: msgId, role: 'assistant', time: now(), streaming: true, blocks: [] }],
  }));
  setState({ generatingId: convId });

  const update = (fn: (blocks: HarnaisBlock[]) => HarnaisBlock[]) =>
    patchMessage(convId, msgId, (m) => ({ ...m, blocks: fn(m.blocks) }));
  const push = (block: HarnaisBlock) => update((bs) => [...bs, block]);
  const patchAt = (index: number, block: HarnaisBlock) => update((bs) => bs.map((b, i) => (i === index ? block : b)));

  let at = 300;
  let index = 0;
  const plan = (delay: number, fn: () => void) => {
    at += delay;
    timers.push(
      setTimeout(() => {
        fn();
        harnaisStore.onProgress();
      }, at),
    );
  };
  const stream = (text: string) => {
    const i = index++;
    plan(220, () => push({ type: 'text', text: '' }));
    for (let n = 4; n < text.length + 4; n += 4) {
      const slice = text.slice(0, n);
      plan(16, () => patchAt(i, { type: 'text', text: slice }));
    }
  };

  if (e.extendedThinking) {
    const i = index++;
    const text = thinkingFor(e.text || reply.tool);
    plan(0, () => push({ type: 'thinking', running: true, text }));
    plan(1200, () => patchAt(i, { type: 'thinking', running: false, duration: '1 s', text }));
  }

  const tools: ToolBlock[] = [
    ...(e.webSearch ? [tool('web', 'Recherche web', truncate(e.text, 32), '6 sources consultées')] : []),
    ...e.attachments.map((a) => tool('read', 'Lecture', a.name, a.size)),
    ...(reply.tools?.map((t) => tool(t.tool, t.label, t.target, t.output)) ?? [
      tool('search', 'Recherche', reply.tool, 'données à jour'),
    ]),
  ];
  for (const t of tools) {
    const i = index++;
    plan(180, () => push({ ...t, status: 'running', output: undefined }));
    plan(650, () => patchAt(i, t));
  }

  stream(reply.intro);
  // Les widgets arrivent un par un, comme s'ils étaient construits au fil de la réponse.
  for (const block of reply.blocks) {
    index++;
    plan(block.type === 'text' || block.type === 'list' ? 200 : 420, () => push(structuredClone(block)));
  }
  if (reply.outro) stream(reply.outro);

  plan(150, () => {
    patchMessage(convId, msgId, (m) => ({ ...m, streaming: false }));
    setState({ generatingId: null });
    timers = [];
  });
}

const respond = (convId: string, e: HarnaisSendEvent) => run(convId, scenarioFor(detectIntent(e.text)), e);

/** État du module Harnais : conversations et génération simulée. */
export const harnaisStore = {
  /** Appelé à chaque étape de génération (défilement du fil). */
  onProgress: (): void => undefined,

  find,

  create(text: string, model: string): HarnaisConversation {
    const conv: HarnaisConversation = {
      id: 'c-' + Date.now().toString(36),
      title: text ? truncate(text, 42) : 'Conversation sans titre',
      group: "Aujourd'hui",
      model,
      messages: [],
    };
    setState({ conversations: [conv, ...state.conversations] });
    return conv;
  },

  togglePin: (id: string) => patchConversation(id, (c) => ({ ...c, pinned: !c.pinned })),

  remove(id: string) {
    if (state.generatingId === id) harnaisStore.stop();
    setState({ conversations: state.conversations.filter((c) => c.id !== id) });
  },

  setModel: (id: string, model: string) => patchConversation(id, (c) => ({ ...c, model })),

  feedback: (convId: string, msgId: string, value: 'up' | 'down') =>
    patchMessage(convId, msgId, (m) => ({ ...m, feedback: m.feedback === value ? null : value })),

  send(convId: string, e: HarnaisSendEvent) {
    const userMsg: HarnaisMessage = {
      id: 'u-' + Date.now().toString(36),
      role: 'user',
      time: now(),
      attachments: e.attachments.length ? e.attachments : undefined,
      blocks: [{ type: 'text', text: e.text || 'Voici les fichiers joints.' }],
    };
    patchConversation(convId, (c) => ({ ...c, messages: [...c.messages, userMsg] }));
    respond(convId, e);
  },

  /** Rejoue la dernière demande en remplaçant la dernière réponse. */
  retry(convId: string) {
    const conv = find(convId);
    if (!conv || state.generatingId) return;
    const idx = conv.messages.map((m) => m.role).lastIndexOf('user');
    const lastUser = conv.messages[idx];
    if (!lastUser) return;
    const text = lastUser.blocks.find((b) => b.type === 'text');
    patchConversation(convId, (c) => ({ ...c, messages: c.messages.slice(0, idx + 1) }));
    respond(convId, {
      text: text?.type === 'text' ? text.text : '',
      attachments: lastUser.attachments ?? [],
      extendedThinking: true,
      webSearch: false,
    });
  },

  stop() {
    const convId = state.generatingId;
    timers.forEach(clearTimeout);
    timers = [];
    setState({ generatingId: null });
    const conv = find(convId);
    const last = conv?.messages[conv.messages.length - 1];
    if (!conv || !last?.streaming) return;
    patchMessage(conv.id, last.id, (m) => ({
      ...m,
      streaming: false,
      stopped: true,
      blocks: m.blocks.map((b): HarnaisBlock =>
        b.type === 'thinking'
          ? { ...b, running: false, duration: b.duration ?? '—' }
          : b.type === 'tool' && b.status === 'running'
            ? { ...b, status: 'error', output: 'Interrompu' }
            : b,
      ),
    }));
  },

  /** L'utilisateur a rempli un formulaire posé par l'agent : on le fige, on récapitule, l'agent enchaîne. */
  submitForm(convId: string, msgId: string, index: number, values: Record<string, unknown>) {
    if (state.generatingId) return;
    const block = find(convId)?.messages.find((m) => m.id === msgId)?.blocks[index];
    if (block?.type !== 'form') return;
    patchMessage(convId, msgId, (m) => ({
      ...m,
      blocks: m.blocks.map((b, i) => (i === index ? { ...block, values } : b)),
    }));
    const recap = block.fields
      .filter((f) => {
        const v = values[f.key];
        return v !== null && v !== '' && !(Array.isArray(v) && !v.length);
      })
      .map((f) => `${f.label} : ${describeValue(f, values[f.key])}`)
      .join('\n');
    pushUser(convId, `${block.title ?? 'Formulaire'} — envoyé\n${recap}`);
    run(convId, formFollowUp(block.formId, values), {
      text: block.title ?? '',
      attachments: [],
      extendedThinking: false,
      webSearch: false,
    });
  },

  /**
   * Réponse à un widget interactif (choix rapide, autorisation, fichier, sélection dans un arbre) :
   * le widget mémorise la réponse, elle devient un message de l'utilisateur et l'agent enchaîne.
   */
  choose(convId: string, msgId: string, index: number, option: HzOption) {
    if (state.generatingId) return;
    const block = find(convId)?.messages.find((m) => m.id === msgId)?.blocks[index];
    if (!block) return;
    // Pour les fichiers et les sélections, on garde le libellé lisible ; sinon la valeur.
    const selected = block.type === 'upload' || block.type === 'tree' ? option.label : option.value;
    if (HARNAIS_ANSWERABLE.has(block.type)) {
      patchMessage(convId, msgId, (m) => ({
        ...m,
        blocks: m.blocks.map((b, i) => (i === index ? ({ ...b, selected } as HarnaisBlock) : b)),
      }));
    }
    pushUser(convId, option.label);
    run(convId, answerFollowUp(block.type, option), {
      text: option.label,
      attachments: [],
      extendedThinking: block.type === 'choices',
      webSearch: false,
    });
  },
};

export const useHarnais = (): HarnaisState => useSyncExternalStore(subscribe, () => state);
