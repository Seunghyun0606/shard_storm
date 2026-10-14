import { CONFIG as C } from './config.js';
export const skillDefinitions = C.skillDefinitions.map(node => ({ ...node, ...C.upgrades[node.id], label: C.upgrades[node.id].name, maxLevel: C.upgrades[node.id].max, effectKey: node.id, description: C.upgrades[node.id].subtitle, implemented: node.implemented !== false }));
export function validateSkillTree(definitions = skillDefinitions) {
  const nodes = new Map(definitions.map(n => [n.id, n]));
  if (nodes.size !== definitions.length) throw new Error('Duplicate skill ID');
  const done = new Set(), path = new Set();
  function visit(id) {
    if (path.has(id)) throw new Error(`Cyclic prerequisite: ${id}`);
    if (done.has(id)) return;
    const node = nodes.get(id); if (!node) throw new Error(`Unknown prerequisite: ${id}`);
    path.add(id);
    for (const p of node.prerequisites) { const parent = nodes.get(p.id); if (!parent || !Number.isInteger(p.minLevel) || p.minLevel < 1 || p.minLevel > parent.maxLevel) throw new Error(`Invalid prerequisite: ${p.id}`); visit(p.id); }
    path.delete(id); done.add(id);
  }
  definitions.forEach(n => visit(n.id)); return true;
}
validateSkillTree();
export const skillCost = (key, level) => Math.ceil(C.upgrades[key].baseCost * C.costGrowth ** level);
export function skillState(key, levels, bank, progression = {}) {
  const node = skillDefinitions.find(n => n.id === key); if (!node) return { state: 'locked', unlocked: false, canBuy: false };
  const level = levels[key] || 0, max = level >= node.maxLevel;
  const requiredRank=node.rank||0,catalystCost=node.catalyst?.[level]||0,rankMet=(progression.discoveryRank||0)>=requiredRank,catalystMet=(progression.catalystBalance||0)>=catalystCost;
  const unlocked = node.implemented && rankMet && node.prerequisites.every(p => (levels[p.id] || 0) >= p.minLevel), cost = skillCost(key, level);
  return { level, cost, max, unlocked, requiredRank, catalystCost, rankMet, catalystMet, affordable: bank >= cost && catalystMet, canBuy: unlocked && !max && bank >= cost && catalystMet,
    state: !node.implemented ? 'coming' : max ? 'max' : !unlocked ? 'locked' : level > 0 ? 'purchased' : bank >= cost ? 'affordable' : 'available' };
}
export function getDerivedStats(levels = {}) {
  const lv = key => levels[key] || 0, amp = lv('chainAmplifier');
  return {
    directDamage: C.directDamage + lv('crushPower') * C.upgrades.crushPower.perLevel,
    attackInterval: Math.max(C.crushSpeed.minimum, C.attackInterval - lv('crushSpeed') * C.crushSpeed.perLevel),
    duration: C.duration + lv('extraTime') * C.upgrades.extraTime.perLevel,
    triangleDamage: C.shapes.triangle.shardDamage + lv('shardPower') * C.upgrades.shardPower.perLevel,
    pentagonDamage: C.shapes.pentagon.shardDamage + lv('shardPower') * C.upgrades.shardPower.perLevel,
    shardRange: C.shard.range + C.shard.rangePerLevel * lv('shardRange'), bounces: C.shard.bounces + lv('ricochetPlus'),
    triangleCount: 3 + lv('shardBloom'), pentagonCount: 2 + lv('shardBloom'),
    squareDamage: C.shapes.square.areaDamage + amp * C.upgrades.chainAmplifier.perLevel,
    starDamage: C.shapes.star.areaDamage + amp * C.upgrades.chainAmplifier.perLevel,
    squareRadius: C.shapes.square.areaRadius + amp * C.amplifierRadius,
    starRadius: C.shapes.star.areaRadius + amp * C.amplifierRadius,
    inheritanceDamage: C.inheritance.damage + lv('echoCatalyst'), impactEnabled: lv('impactPulse') > 0,
    impactRadius: C.impact.radius, impactDamage: C.impact.damage, bonusMultiplier: 1 + C.photonBoostPerLevel * lv('photonBoost')
  };
}
export function describeSkill(key, levels) {
  const s = getDerivedStats(levels);
  const descriptions = {
    crushPower: `직접 피해 ${s.directDamage}`, crushSpeed: `반복 간격 ${s.attackInterval.toFixed(2)}초`,
    impactPulse: s.impactEnabled ? `반경 ${s.impactRadius}px · 피해 ${s.impactDamage}` : '직접 타격 추가 파동 없음',
    shardPower: `주 파편 피해 ${s.triangleDamage}`, shardRange: `최대 ${s.shardRange}px`, ricochetPlus: `벽 반사 ${s.bounces}회`,
    shardBloom: `삼각 ${s.triangleCount} / 오각 ${s.pentagonCount} 파편`, chainAmplifier: `사각 ${s.squareDamage} / ${s.squareRadius}px · 별 ${s.starDamage} / ${s.starRadius}px`,
    echoCatalyst: `계승 피해 ${s.inheritanceDamage}`, extraTime: `${s.duration}초`, photonBoost: `파괴 보너스 ×${s.bonusMultiplier.toFixed(2)} (올림)`,
    precisionFracture: `Cracked 직접 최종타: Raw +${10*(levels[key]||0)} · 파편 ${(levels[key]||0)?(levels[key]||0)+1:0}개 / 피해1 / 60px · 재유발 없음`,
    yieldStabilizer: (levels[key]||0)>=2?'원래 ×.8→1 / ×1→1.1':levels[key]?'원래 ×.8→1':'슬롯 보정 없음',
    rareSeparator: `Core Raw +${40*(levels[key]||0)} · 첫 Core 추가 Catalyst ${(levels[key]||0)>=2?1:0}/Run`,
    fragmentRelay: `주 파편 최종타: 피해${levels[key]||0} / ${(levels[key]||0)===2?90:80}px · 최대4/Chain · 재귀/반사 없음`,
    kineticReach: `회전 원본 주 파편 거리 +${30*(levels[key]||0)}px · 추적/파동 미적용`,
    resonanceLayer: `Reactor→Charged: .08초 뒤 피해1 / ${40+10*(levels[key]||0)}px · 최대2/파동 · 재귀 없음`,
    salvageScanner: `첫1초 희귀 강조 · Core +${.5*(levels[key]||0)}%p · Rank4 Void +${.1*(levels[key]||0)}%p`,
    catalystChannel: levels[key]?'Ancient당 최초2 일반 도형 표식1초 · 직접 파괴 파편2/피해1/70px · 재귀 없음':'Channel 표식 없음'
  };
  return descriptions[key] || '';
}
// The same definitions drive every node, edge, prerequisite label and purchase.
export function renderSkillTree(container, info, save, selected, onSelect, onBuy, stateFor = skillState) {
  const width = 1120, rowHeight = 86, nodeWidth = 174, nodeHeight = 62;
  const position = node => ({ x: 112 + node.position.col * 224, y: 126 + (node.position.row - 1) * rowHeight });
  const height = Math.max(...skillDefinitions.map(n => position(n).y)) + 58;
  const graph = document.createElement('div'); graph.className = 'skill-graph'; graph.style.width = `${width}px`; graph.style.height = `${height}px`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('skill-lines');
  const nodes = new Map(skillDefinitions.map(n => [n.id, n]));
  for (const node of skillDefinitions) {
    const to = position(node), parents = node.prerequisites.length ? node.prerequisites : [{ id: 'root', minLevel: 0 }];
    for (const p of parents) {
      const from = p.id === 'root' ? { x: width / 2, y: 34 } : position(nodes.get(p.id));
      const startY = from.y + (p.id === 'root' ? 18 : nodeHeight / 2), endY = to.y - nodeHeight / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      // Route long branch edges beside the column, avoiding intermediate nodes.
      const long = p.id !== 'root' && to.y - from.y > rowHeight + 1, sideX = to.x - nodeWidth / 2 - 12;
      path.setAttribute('d', long ? `M${from.x},${startY} H${sideX} V${endY} H${to.x} V${endY + 1}` : `M${from.x},${startY} V${(startY + endY) / 2} H${to.x} V${endY}`);
      path.classList.add('skill-edge'); if (p.id === 'root' || (save.levels[p.id] || 0) >= p.minLevel) path.classList.add('active');
      path.dataset.from = p.id; path.dataset.to = node.id; svg.append(path);
    }
  }
  graph.append(svg);
  const root = document.createElement('div'); root.className = 'skill-root'; root.textContent = '◈ CORE / ROOT'; graph.append(root);
  ['DESTROY', 'CASCADE', 'REACTION', 'UTILITY','REFINERY / LEGACY'].forEach((text, col) => { const label = document.createElement('div'); label.className = `branch-label branch-${col}`; label.style.left = `${112 + col * 224}px`; label.textContent = text; graph.append(label); });
  for (const node of skillDefinitions) {
    const state = stateFor(node.id, save.levels, save.bank,save), p = position(node), button = document.createElement('button');
    button.type = 'button'; button.className = `skill-node ${state.state} ${node.id === selected ? 'selected' : ''}`; button.dataset.skill = node.id; button.dataset.state = state.state; button.setAttribute('aria-pressed', String(node.id === selected));
    button.style.left = `${p.x - nodeWidth / 2}px`; button.style.top = `${p.y - nodeHeight / 2}px`;
    button.innerHTML = `<strong>${state.state === 'locked' ? '▣ ' : ''}${node.label}</strong><span>Lv.${state.level} / ${node.maxLevel}</span><small>${state.max ? 'MAX' : state.state === 'locked' ? `LOCKED · Rank${state.requiredRank} / 선행` : state.state === 'coming' ? 'COMING LATER' : `${state.cost} ◈ + ${state.catalystCost} Catalyst`}</small>`;
    button.onclick = () => onSelect(node.id); graph.append(button);
  }
  const scroll = { left: container.scrollLeft, top: container.scrollTop }; container.replaceChildren(graph); container.scrollLeft = scroll.left; container.scrollTop = scroll.top;
  const node = nodes.get(selected), state = stateFor(selected, save.levels, save.bank,save);
  const prerequisites = node.prerequisites.map(p => `${nodes.get(p.id).label} Lv.${p.minLevel}${(save.levels[p.id] || 0) >= p.minLevel ? ' ✓' : ''}`).join(' · ') || '없음';
  const next = state.max ? '최대 레벨' : describeSkill(selected, { ...save.levels, [selected]: state.level + 1 });
  info.innerHTML = `<div class="skill-info-text"><strong>${node.label} <span>Lv.${state.level} / ${node.maxLevel}</span></strong><p>현재: ${describeSkill(selected, save.levels)} → 다음: ${next}</p><small>선행: ${prerequisites} · Rank ${state.requiredRank} · Photon ${state.cost} + Catalyst ${state.catalystCost}</small></div>`;
  const buy = document.createElement('button'); buy.id = 'skill-purchase'; buy.dataset.upgrade = selected; buy.disabled = !state.canBuy;
  buy.textContent = state.max ? 'MAX' : !state.rankMet ? `Rank ${state.requiredRank} 필요` : !state.unlocked ? '선행 스킬 필요' : !state.catalystMet ? `Catalyst ${state.catalystCost} 필요` : `강화 · ${state.cost} ◈`; buy.onclick = () => onBuy(selected); info.append(buy);
}
