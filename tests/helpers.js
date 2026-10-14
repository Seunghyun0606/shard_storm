import { Game } from '../game.js';
import { CONFIG as C } from '../config.js';
// Historical mechanics run on the explicit static v0.8 comparison ruleset.
// New v0.9 tests import the production Game directly and test its new contracts.
export class LegacyGame extends Game { constructor(options = {}) { super({ ...options, ruleset: 'legacy_v08', runId: options.runId || `legacy-${options.seed ?? C.seed}`, options: { ...options.options, motionEnabled: false } }); } }
export function emptyGame(options = {}) { const g = new LegacyGame(options); g.shapes = []; return g; }
export function advance(g, seconds) { for (let i = 0; i < Math.ceil(seconds / C.step); i++) g.update(C.step); }
export function cause(g, source = 'direct', depth = 0, chainId = g.newChain(), angle = 0) { return { source, depth, chainId, angle }; }
export const memoryStorage = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; };
