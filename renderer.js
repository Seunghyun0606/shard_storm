import { CONFIG as C } from './config.js';
export function polygon(ctx, s, scale = 1, variety = true) {
  const cfg = C.shapes[s.type], damageStage = s.hp === s.maxHP ? 0 : Math.min(3, Math.ceil((1 - s.hp / s.maxHP) * 3));
  ctx.beginPath();
  const vertices = variety && s.appearance ? s.appearance.localVertices : Array.from({ length: cfg.sides }, (_, i) => { const a = i * Math.PI * 2 / cfg.sides, r = (s.appearance?.baseRadius || s.radius) * (s.type === 'star' && i % 2 ? cfg.innerRatio : 1); return { x: Math.cos(a) * r, y: Math.sin(a) * r }; });
  const cos = Math.cos(s.angle), sin = Math.sin(s.angle), line = v => ctx.lineTo((v.x * cos - v.y * sin) * scale, (v.x * sin + v.y * cos) * scale);
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    if (damageStage && (s.appearance?.clippedCorners.slice(0, damageStage) || [0, 1, 2].slice(0, damageStage)).includes(i)) {
      for (const neighbour of [vertices[(i - 1 + vertices.length) % vertices.length], vertices[(i + 1) % vertices.length]]) line({ x: v.x * .84 + neighbour.x * .16, y: v.y * .84 + neighbour.y * .16 });
    } else line(v);
  }
  ctx.closePath();
}
export function draw(ctx, game, fps = 60) {
  ctx.clearRect(0, 0, C.width, C.height); ctx.fillStyle = '#0c1419'; ctx.fillRect(0, 0, C.width, C.height);
  ctx.fillStyle = '#1b2a31'; for (let x = C.arena.left; x <= C.arena.right; x += 32) for (let y = C.arena.top; y <= C.arena.bottom; y += 32) ctx.fillRect(x, y, 1, 1);
  ctx.strokeStyle = '#293b42'; ctx.lineWidth = 1; ctx.strokeRect(C.arena.left, C.arena.top, C.arena.right - C.arena.left, C.arena.bottom - C.arena.top);
  const hud = game ? [[`${game.remaining.toFixed(1)}s`, 'TIME LEFT'], [String(game.totalDestroyed), 'DESTROYED'], [`+${game.runEarned}`, 'RAW SHARDS'], [`${game.currentChain} / ${game.bestChain}`, 'CHAIN / BEST']] : [[`${C.duration.toFixed(1)}s`,'TIME LEFT'],['0','DESTROYED'],['+0','RAW SHARDS'],['0 / 0','CHAIN / BEST']];
  hud.forEach(([value, label], i) => { const x = 42 + i * 231; ctx.font = '9px Arial'; ctx.fillStyle = '#80999f'; ctx.fillText(label, x, 24); ctx.font = 'bold 22px Arial'; ctx.fillStyle = i === 2 ? C.shapes.triangle.color : '#e8f0ed'; if (i === 0 && game?.remaining <= 10) ctx.fillStyle = '#ff6eab'; ctx.fillText(value, x, 53); });
  if (!game) return;
  ctx.save(); ctx.beginPath(); ctx.rect(C.arena.left, C.arena.top, C.arena.right - C.arena.left, C.arena.bottom - C.arena.top); ctx.clip();
  for (const s of game.alive) {
    const cfg = C.shapes[s.type], scale = (s.grace > 0 ? Math.max(.1, 1 - s.grace / C.spawnGrace) : 1) * (1 + (C.visual.recoilScale - 1) * s.recoil / C.visual.recoilLife);
    const knock = s.knockTime / C.visual.knockbackLife;
    ctx.save(); ctx.translate(s.x + s.knockX * Math.sin(knock * Math.PI), s.y + s.knockY * Math.sin(knock * Math.PI));
    polygon(ctx, s, scale, game.options.visualVariety); ctx.fillStyle = s.flash > 0 ? '#ffffffdd' : game.options.visualVariety ? s.appearance.fill : `${cfg.color}24`; ctx.fill(); ctx.strokeStyle = s.flash > 0 ? '#ffffff' : cfg.color; ctx.lineWidth = s.enhanced ? 3 : 1.8; ctx.stroke();
    if (game.options.visualVariety && s.appearance.pattern !== 'none') {
      ctx.save(); polygon(ctx, s, scale, true); ctx.clip(); ctx.globalAlpha = .5; ctx.strokeStyle = cfg.color; ctx.lineWidth = .7;
      if (s.appearance.pattern === 'inset') { polygon(ctx, s, scale * .66, true); ctx.stroke(); }
      else { ctx.rotate(s.angle); ctx.beginPath(); if (s.appearance.pattern === 'split-line') { ctx.moveTo(-s.radius, -s.radius * .2); ctx.lineTo(s.radius, s.radius * .2); } else { ctx.moveTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.lineTo(-5, 0); ctx.closePath(); } ctx.stroke(); }
      ctx.restore();
    }
    if (s.enhanced) { polygon(ctx, s, scale * .79, game.options.visualVariety); ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#e9f9ff'; ctx.save(); ctx.rotate(s.angle); ctx.fillRect(-3, -4, 6, 8); ctx.restore(); }
    if (s.modifier === 'charged' && game.options.modifierVisuals) {
      ctx.save(); ctx.rotate(s.angle); ctx.strokeStyle = '#e4fff4'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      const pulse = 1 + .06 * Math.sin(game.elapsed * Math.PI * 4);
      for (const r of [s.radius + 3, s.radius + 7]) { ctx.beginPath(); ctx.arc(0, 0, r * pulse, 0, Math.PI * 2); ctx.stroke(); }
      ctx.setLineDash([]); ctx.shadowColor = cfg.color; ctx.shadowBlur = 8; ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.lineTo(-5, 0); ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    if (s.hp < s.maxHP) {
      const stage = Math.min(3, Math.ceil((1 - s.hp / s.maxHP) * 3)); ctx.save(); polygon(ctx, s, scale, game.options.visualVariety); ctx.clip(); ctx.strokeStyle = '#eefcff'; ctx.globalAlpha = .8; ctx.lineWidth = s.modifier === 'cracked' && game.options.modifierVisuals ? 2 : .9;
      for (const crack of s.appearance.cracks.slice(0, stage)) { const a = crack.angle + s.angle, r = s.appearance.baseRadius * crack.length; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a + crack.bend) * r * .45, Math.sin(a + crack.bend) * r * .45); ctx.lineTo(-Math.sin(a) * 2, Math.cos(a) * 2); ctx.stroke(); } ctx.restore();
    }
    // Small HP ticks make multi-hit breakpoints easy to read.
    ctx.fillStyle = cfg.color; for (let i = 0; i < s.hp; i++) ctx.fillRect((i - (s.hp - 1) / 2) * 4 - 1, s.radius + 8, 2, 2);
    ctx.restore();
  }
  for (const s of game.shards) { ctx.beginPath(); ctx.moveTo(s.x - Math.cos(s.angle) * (s.small ? 8 : 16), s.y - Math.sin(s.angle) * (s.small ? 8 : 16)); ctx.lineTo(s.x, s.y); ctx.strokeStyle = C.shapes[s.source]?.color || '#ffffff'; ctx.lineWidth = s.small ? 1.4 : 2.8; ctx.stroke(); }
  for (const wave of game.waves) {
    const travelLife = wave.maxRadius / wave.speed, fading = Math.max(0, wave.age - travelLife) / C.propagation.tailLife;
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - fading); ctx.strokeStyle = wave.color; ctx.lineWidth = wave.sourceKind === 'star' ? 2.8 : 2;
    if (wave.sourceKind === 'impact') ctx.setLineDash([5, 3]);
    const rings = wave.sourceKind === 'star' ? [1, .82, .61] : [1];
    for (const scale of rings) { ctx.beginPath(); ctx.arc(wave.x, wave.y, wave.radius * scale, 0, Math.PI * 2); ctx.stroke(); }
    if (wave.sourceKind === 'square') { ctx.lineWidth = .8; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + wave.id; ctx.beginPath(); ctx.moveTo(wave.x + Math.cos(a) * wave.radius, wave.y + Math.sin(a) * wave.radius); ctx.lineTo(wave.x + Math.cos(a + .03) * Math.max(0, wave.radius - 4), wave.y + Math.sin(a + .03) * Math.max(0, wave.radius - 4)); ctx.stroke(); } }
    ctx.restore();
  }
  for (const v of game.visuals) {
    const t = v.age / v.life; ctx.save(); ctx.globalAlpha = 1 - t; ctx.strokeStyle = v.color; ctx.fillStyle = v.color;
    if (v.kind === 'ring') { ctx.beginPath(); ctx.arc(v.x, v.y, v.radius * (.15 + .85 * t), 0, Math.PI * 2); ctx.lineWidth = 3 * (1 - t) + 1; ctx.stroke(); }
    if (v.kind === 'death') { ctx.translate(v.x, v.y); polygon(ctx, v.shape, 1 - t, game.options.visualVariety); if (v.age < C.visual.flash) { ctx.fillStyle = '#ffffff'; ctx.fill(); } ctx.lineWidth = 1; ctx.stroke(); }
    if (v.kind === 'popup') { ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText(v.text, v.x, v.y - 28 - t * 25); }
    ctx.restore();
  }
  for (const p of game.particles) { ctx.save(); ctx.globalAlpha = 1 - p.age / p.life; ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(3, 0); ctx.lineTo(-1, 3); ctx.closePath(); ctx.fill(); ctx.restore(); }
  for (const ring of game.clickVFX.items) { const t = ring.age / ring.life; ctx.save(); ctx.globalAlpha = (1 - t) * (ring.hit ? .9 : .25); ctx.strokeStyle = '#f5fdff'; ctx.lineWidth = ring.hit ? 1.6 : .8; ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.hit ? C.visual.clickStart + (C.visual.clickEnd - C.visual.clickStart) * t : 3 + (C.visual.missEnd - 3) * t, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (game.elapsed < C.visual.guideLife && game.alive.some(s => s.id === 1)) {
    const t = C.tutorial; ctx.strokeStyle = '#42efcf88'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(t.x, t.y, 37 + Math.sin(game.elapsed * 5) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#b8e9df'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillText('여기서 첫 연쇄를 시작하세요 ↓', t.x, t.y - 50); ctx.textAlign = 'left';
  }
  ctx.restore();
  const combo = game.options.comboFeedback && game.state === 'PLAYING' && game.combo.visible(game.elapsed);
  if (combo) {
    const t = Math.max(0, (game.elapsed - combo.at) / combo.life);
    ctx.save(); ctx.globalAlpha = Math.min(1, (1 - t) * 4); ctx.strokeStyle = combo.color; ctx.fillStyle = combo.color;
    // One compact banner above targets; the accent is cosmetic and bounded.
    ctx.fillStyle = '#0c1419e8'; ctx.fillRect(285, 80, 390, 39);
    ctx.fillStyle = combo.color; ctx.font = `bold ${combo.threshold === 20 ? 22 : 18}px Arial`; ctx.textAlign = 'center';
    ctx.fillText(`${combo.label} ×${combo.kills}`, C.width / 2, 107);
    if (combo.accent) {
    ctx.lineWidth = combo.threshold === 5 ? 1 : 2;
    ctx.beginPath(); ctx.arc(combo.x, combo.y, 24 + 46 * t, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < (combo.threshold === 5 ? 6 : 10); i++) { const a = i * Math.PI / 5, r = 30 + 35 * t; ctx.beginPath(); ctx.moveTo(combo.x + Math.cos(a) * r, combo.y + Math.sin(a) * r); ctx.lineTo(combo.x + Math.cos(a) * (r + 6), combo.y + Math.sin(a) * (r + 6)); ctx.stroke(); }
    if (combo.threshold >= 10 && t < .45) { ctx.globalAlpha *= .35; ctx.strokeRect(C.arena.left, C.arena.top, C.arena.right - C.arena.left, C.arena.bottom - C.arena.top); }
    }
    ctx.restore();
  }
}
