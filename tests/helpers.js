import { Game } from '../game.js';
import { CONFIG as C } from '../config.js';
export function emptyGame(options = {}) { const g = new Game(options); g.shapes = []; return g; }
export function advance(g, seconds) { for (let i = 0; i < Math.ceil(seconds / C.step); i++) g.update(C.step); }
export function cause(g, source = 'direct', depth = 0, chainId = g.newChain(), angle = 0) { return { source, depth, chainId, angle }; }
export const memoryStorage = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; };
