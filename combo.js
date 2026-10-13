import { CONFIG as C } from './config.js';

// Presentation only: never consumes gameplay randomness or schedules damage.
export class ComboFeedback {
  constructor() { this.main = null; this.lastAccentAt = -Infinity; }
  promote(event) {
    const active = this.main && event.at < this.main.at + this.main.life;
    if (active && event.threshold < this.main.threshold) return false;
    const sameChainUpgrade = active && event.chainId === this.main.chainId && event.threshold > this.main.threshold;
    const accent = event.at - this.lastAccentAt >= C.combo.cooldown;
    if (!accent && !sameChainUpgrade && !(active && event.threshold > this.main.threshold)) return false;
    const style = C.combo.stages[event.threshold];
    this.main = { ...event, ...style, accent };
    if (accent) this.lastAccentAt = event.at;
    return accent;
  }
  visible(now) { return this.main && now < this.main.at + this.main.life ? this.main : null; }
}
