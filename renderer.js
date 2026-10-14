import { CONFIG as C } from './config.js';
import { spawnAlpha } from './presentation.js';
const ecologyHints={splitter:'Echo2 · 콤보 전용',fuseBomb:'첫 피해 .70초 / 파괴 .08초 폭발',conductor:'파괴 시 연결2대상 전도',mirror:'주 파편 방향 전환 최대2회',gravityWell:'주 파편 휨 최대30°',repairNode:'.85초마다 일반 도형 치유'};
function hudText(ctx,text,width){const measure=s=>ctx.measureText(s)?.width??s.length*6;while(text.length>1&&measure(text)>width)text=text.slice(0,-2)+'…';return text;}
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
export function draw(ctx, game, fps = 60, osReducedMotion = false) {
  ctx.setTransform(ctx.canvas.width / C.width, 0, 0, ctx.canvas.height / C.height, 0, 0);
  ctx.clearRect(0, 0, C.width, C.height); ctx.fillStyle = '#0c1419'; ctx.fillRect(0, 0, C.width, C.height);
  ctx.fillStyle = '#1b2a31'; for (let x = C.arena.left; x <= C.arena.right; x += 32) for (let y = C.arena.top; y <= C.arena.bottom; y += 32) ctx.fillRect(x, y, 1, 1);
  ctx.strokeStyle = '#293b42'; ctx.lineWidth = 1; ctx.strokeRect(C.arena.left, C.arena.top, C.arena.right - C.arena.left, C.arena.bottom - C.arena.top);
  const fx = game?.options.combatFXEnabled && game.state === 'PLAYING' ? game.presentation.active(game.elapsed) : [];
  const reduced = osReducedMotion || game?.options.reducedMotionEnabled;
  const combo = game?.options.comboFeedback && game.state === 'PLAYING' && game.combo.visible(game.elapsed);
  const hud = game ? [[`${game.remaining.toFixed(1)}s`, 'TIME LEFT'], [String(game.totalDestroyed), 'DESTROYED'], [`+${game.runEarned}`, 'RAW SHARDS'], [`${game.currentChain} / ${game.bestChain}`, 'CHAIN / BEST']] : [[`${C.duration.toFixed(1)}s`,'TIME LEFT'],['0','DESTROYED'],['+0','RAW SHARDS'],['0 / 0','CHAIN / BEST']];
  hud.forEach(([value, label], i) => { const x = 42 + i * 231; ctx.font = '9px Arial'; ctx.fillStyle = '#80999f'; if(i===3&&combo){label=combo.label;ctx.fillStyle=combo.color;}if(i===1&&fx.some(e=>e.kind==='fieldClear')){label='FIELD CLEARED';ctx.fillStyle='#6ADFEF';}ctx.fillText(label, x, 24); ctx.font = 'bold 22px Arial'; ctx.fillStyle = i === 2 ? C.shapes.triangle.color : '#e8f0ed'; if (i === 0 && game?.remaining <= 10) ctx.fillStyle = '#ff6eab'; if(i===3&&combo)ctx.fillStyle=combo.color;ctx.fillText(value, x, 53); });
  if (!game) return; ctx.fillStyle='#b8d9d4';ctx.font='10px Arial';const narrow=(ctx.canvas.clientWidth||960)<620;ctx.fillText(narrow?`R${game.discoveryRank} · CAT +${game.pendingCatalyst}`:`RANK ${game.discoveryRank} · PENDING CATALYST +${game.pendingCatalyst}`,C.width-250,72);
  const active=game.contractSnapshot[0],intro=game.ecologyEvents?.findLast(e=>e.kind==='introduction'&&game.elapsed-e.at<1.5);
  const metaLine=intro?`${narrow?'NEW':'FIRST ENCOUNTER'} · ${C.shapes[intro.type].name} · ${ecologyHints[intro.type]}`:`${C.anomalies[game.anomalyId]?.name||'NORMAL'}${active?` · ${C.contracts[active.id].name}: ${active.progress+(game.metaCounters[C.contracts[active.id].counter]||0)} / ${C.contracts[active.id].target*C.meta.contractTargets[active.stage-1]}`:''}`;
  ctx.fillText(hudText(ctx,metaLine,630),42,72);
  ctx.save(); ctx.beginPath(); ctx.rect(C.arena.left, C.arena.top, C.arena.right - C.arena.left, C.arena.bottom - C.arena.top); ctx.clip();
  let links=0;
  for(const s of game.alive.filter(s=>s.linkIds))for(const id of s.linkIds){
    const target=game.alive.find(t=>t.id===id);if(!target||links>=3||Math.hypot(target.x-s.x,target.y-s.y)>115)continue;
    ctx.strokeStyle='#ede08566';ctx.lineWidth=1;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);links++;
  }
  for (const s of game.alive) {
    const cfg = C.shapes[s.type], scale = (s.grace > 0 ? Math.max(.1, 1 - s.grace / C.spawnGrace) : 1) * (1 + (C.visual.recoilScale - 1) * s.recoil / C.visual.recoilLife);
    const knock = s.knockTime / C.visual.knockbackLife;
    ctx.save(); ctx.translate(s.x + s.knockX * Math.sin(knock * Math.PI), s.y + s.knockY * Math.sin(knock * Math.PI));
    ctx.globalAlpha = spawnAlpha(s.grace);
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
    if(s.wardSourceId){ctx.strokeStyle='#90e3ab';ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(0,0,s.radius+5,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(s.type==='hex'){polygon(ctx,s,.7,false);ctx.strokeStyle=s.shieldBroken?'#ffffff':'#90e3ab';ctx.lineWidth=s.shieldBroken?1:3;ctx.stroke();ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillStyle=cfg.color;ctx.fillText(s.shieldBroken?'⌁':'⬡',0,4);}
    if(s.type==='reactor'){ctx.strokeStyle=cfg.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,s.radius*.6,-Math.PI/2,-Math.PI/2+Math.PI*2*s.hp/s.maxHP);ctx.stroke();ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillStyle=cfg.color;ctx.fillText(s.hp<=6?'Ⅱ':'Ⅰ',0,4);}
    if(s.type==='ancient'){ctx.strokeStyle=cfg.color;for(const r of [.35,.6,.83]){ctx.beginPath();ctx.arc(0,0,s.radius*r,0,Math.PI*2);ctx.stroke();}ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillStyle=cfg.color;ctx.fillText(`${s.hp}`,0,4);}
    if(cfg.ecology){ctx.font='bold 16px Arial';ctx.textAlign='center';ctx.fillStyle=cfg.color;ctx.fillText(s.echo?'·':cfg.symbol,0,5);}
    if(s.echo){ctx.font='8px Arial';ctx.textAlign='center';ctx.fillStyle='#91ded7';ctx.fillText('E',0,3);}
    if(s.type==='fuseBomb'&&s.fuseAt&&!s.fuseExploded){ctx.strokeStyle='#fff0cf';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,s.radius+6,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,Math.min(1,(s.fuseAt-game.elapsed)/.7)));ctx.stroke();}
    if(s.type==='gravityWell'){ctx.strokeStyle=cfg.color;ctx.setLineDash([2,5]);ctx.beginPath();ctx.arc(0,0,s.radius+9,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(s.secondaryTrait&&game.options.modifierVisuals){ctx.strokeStyle='#e7efee';ctx.lineWidth=1;ctx.strokeRect(-s.radius-4,-s.radius-4,9,9);ctx.fillStyle='#fff';ctx.font='8px Arial';ctx.textAlign='center';const marks={reinforced:s.armorUsed?'':'▣',volatile:'✴',reflective:'↪',hollow:'◌'};ctx.fillText(marks[s.secondaryTrait]||'',-s.radius+.5,-s.radius+3);}
    if(s.oreGrade&&s.oreGrade!=='common'){const color={prism:'#a9faff',core:'#fff6bc',void:'#e1b2ff'}[s.oreGrade];ctx.save();ctx.translate(s.radius*.4,-s.radius*.45);ctx.fillStyle='#0c1419';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.stroke();ctx.fillStyle=color;ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText(C.ore[s.oreGrade].symbol,0,4);ctx.restore();if(game.levels.salvageScanner&&game.elapsed<1){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,s.radius+10,0,Math.PI*2);ctx.stroke();}}
    if(s.channelUntil>=game.elapsed){ctx.strokeStyle='#d7bdff';ctx.lineWidth=2;ctx.setLineDash([4,2]);ctx.strokeRect(-s.radius-5,-s.radius-5,2*s.radius+10,2*s.radius+10);ctx.setLineDash([]);}
    // Small HP ticks make multi-hit breakpoints easy to read.
    ctx.fillStyle = cfg.color; for (let i = 0; i < Math.min(12,s.hp); i++) ctx.fillRect((i - (Math.min(12,s.hp) - 1) / 2) * 4 - 1, s.radius + 8, 2, 2);
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
    const emphasize = !reduced && fx.some(e=>['combo','special'].includes(e.kind));
    const t = Math.min(1,v.age / v.life * (emphasize ? .65 : 1)); ctx.save(); ctx.globalAlpha = 1 - t; ctx.strokeStyle = v.color; ctx.fillStyle = v.color;
    if (v.kind === 'ring') { ctx.beginPath(); ctx.arc(v.x, v.y, v.radius * (.15 + .85 * t), 0, Math.PI * 2); ctx.lineWidth = 3 * (1 - t) + 1; ctx.stroke(); }
    if (v.kind === 'death') { ctx.translate(v.x, v.y); polygon(ctx, v.shape, 1 - t, game.options.visualVariety); if (v.age < C.visual.flash) { ctx.fillStyle = '#ffffff'; ctx.fill(); } ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }
  for (const p of game.particles) { ctx.save(); ctx.globalAlpha = 1 - p.age / p.life; const emphasis=!reduced&&fx.some(e=>['combo','special'].includes(e.kind));ctx.translate(p.x-(emphasis?p.vx*p.age*.25:0), p.y-(emphasis?p.vy*p.age*.25:0)); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(3, 0); ctx.lineTo(-1, 3); ctx.closePath(); ctx.fill(); ctx.restore(); }
  for (const ring of game.clickVFX.items) { const t = ring.age / ring.life; ctx.save(); ctx.globalAlpha = (1 - t) * (ring.hit ? .9 : .25); ctx.strokeStyle = '#f5fdff'; ctx.lineWidth = ring.hit ? 1.6 : .8; ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.hit ? C.visual.clickStart + (C.visual.clickEnd - C.visual.clickStart) * t : 3 + (C.visual.missEnd - 3) * t, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (game.elapsed < C.visual.guideLife && game.alive.some(s => s.id === 1)) {
    const t = C.tutorial; ctx.strokeStyle = '#42efcf88'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(t.x, t.y, 37 + (reduced?0:Math.sin(game.elapsed * 5) * 3), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
  // Shake only noninteractive highlights/debris, keeping target silhouettes at their hit coordinates.
  ctx.save();ctx.beginPath();ctx.rect(C.arena.left,C.arena.top,C.arena.right-C.arena.left,C.arena.bottom-C.arena.top);ctx.clip();
  for (const e of fx) {
    const t=(game.elapsed-e.at)/e.life;ctx.save();ctx.globalAlpha=(1-t)*.65;ctx.strokeStyle=e.color||combo?.color||'#6ADFEF';ctx.lineWidth=1.5;
    const shake=!reduced&&game.options.screenShakeEnabled?e.shake:0;
    const cssScale=C.width/(ctx.canvas.clientWidth||C.width);
    ctx.translate(Math.sin(t*35)*shake*cssScale,Math.cos(t*29)*shake*cssScale);
    if(['special','combo'].includes(e.kind)){if(e.kind==='special'||e.threshold>=10)ctx.strokeRect(C.arena.left+2,C.arena.top+2,C.arena.right-C.arena.left-4,C.arena.bottom-C.arena.top-4);}
    if(e.kind==='fieldClear'){ctx.beginPath();ctx.arc(e.x,e.y,20+110*t,0,Math.PI*2);ctx.stroke();}
    if(e.kind==='hit'){for(const r of [5+15*t,17-7*t]){ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#ffffff';ctx.fillRect(e.x-2,e.y-2,4,4);}
    if(e.kind==='death'){ctx.beginPath();ctx.moveTo(e.x-5,e.y);ctx.lineTo(e.x+5,e.y);ctx.moveTo(e.x,e.y-5);ctx.lineTo(e.x,e.y+5);ctx.stroke();}
    ctx.restore();
  }
  ctx.restore();
}
