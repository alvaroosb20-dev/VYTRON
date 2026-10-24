/**
 * Hoja de control de las demostraciones animadas.
 *
 *   node scripts/render-demos.mjs [carpeta-salida]
 *
 * Compila src/lib/demoEngine.ts y src/data/demos.ts con TypeScript, dibuja cada ejercicio
 * en varios instantes del ciclo y escribe demos.html (hoja de control) y una carpeta svg/
 * con el fotograma inicial de cada ejercicio. Sirve para revisar que cada movimiento es
 * correcto sin abrir la app. Necesita el paquete `typescript` (ya está en devDependencies).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] ?? path.join(root, 'demo-check'));
const tmp = path.join(out, '.build');
fs.mkdirSync(tmp, { recursive: true });

const compile = (src, dest) => {
  let code = fs.readFileSync(path.join(root, src), 'utf8');
  code = code.replace("'@/lib/demoEngine'", "'./demoEngine.mjs'");
  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  fs.writeFileSync(path.join(tmp, dest), js);
};
compile('src/lib/demoEngine.ts', 'demoEngine.mjs');
compile('src/data/demos.ts', 'demos.mjs');
const engine = await import(pathToFileURL(path.join(tmp, 'demoEngine.mjs')).href);
const { DEMOS } = await import(pathToFileURL(path.join(tmp, 'demos.mjs')).href);

// Nombres y músculos desde exercises.ts (sin compilar sus dependencias).
const exSrc = fs.readFileSync(path.join(root, 'src/data/exercises.ts'), 'utf8');
const EX = [...exSrc.matchAll(/id: '([^']+)', name: '([^']+)', muscle: '([^']+)'/g)].map((m) => ({ id: m[1], name: m[2], muscle: m[3] }));
const FOCUS = { Pecho: ['torso'], Espalda: ['torso'], Core: ['torso'], Hombros: ['ua'], 'Bíceps': ['ua'], 'Tríceps': ['ua'], 'Cuádriceps': ['th'], Isquios: ['th'], 'Glúteos': ['th'], Gemelos: ['sn'] };

const svg = (demo, ms, focus, size = 240) => {
  const { joints } = engine.sample(demo, ms);
  const shapes = engine.draw(demo, joints, focus);
  const box = engine.frameBox(demo);
  const g = engine.groundLine(demo, box);
  if (g) shapes.unshift(g);
  const el = shapes.map((s) => s.t === 'line'
    ? `<line x1="${s.x1.toFixed(1)}" y1="${s.y1.toFixed(1)}" x2="${s.x2.toFixed(1)}" y2="${s.y2.toFixed(1)}" stroke="${s.c}" stroke-width="${s.w}" stroke-linecap="round"/>`
    : s.t === 'circle'
      ? `<circle cx="${s.cx.toFixed(1)}" cy="${s.cy.toFixed(1)}" r="${s.r}" fill="${s.fill}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.sw}"` : ''}/>`
      : `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx}" fill="${s.fill}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.sw}"` : ''}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map((v) => v.toFixed(1)).join(' ')}" width="${size}" height="${(size * 200) / 240}" style="background:#171719;border-radius:12px">${el}</svg>`;
};

const problems = [];
const rows = EX.map((e) => {
  const demo = DEMOS[e.id];
  if (!demo) { problems.push(`${e.id}: sin demostración`); return `<tr><td>${e.name}</td><td colspan=6 style="color:#FF5A4E">SIN DEMOSTRACIÓN</td></tr>`; }
  const focus = demo.focus ?? FOCUS[e.muscle] ?? [];
  const total = engine.cycleMs(demo);
  // Comprueba que nada se sale del lienzo en todo el ciclo.
  check: for (let t = 0; t < total; t += 40) {
    const { joints } = engine.sample(demo, t);
    for (const [k, [x, y]] of Object.entries(joints)) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) problems.push(`${e.id}: ${k} no es un número en t=${t}`);
      else if (!demo.noGround && y > 193) { problems.push(`${e.id}: ${k} atraviesa el suelo (${x.toFixed(0)}, ${y.toFixed(0)}) en t=${t}`); break check; }
    }
  }
  fs.mkdirSync(path.join(out, 'svg'), { recursive: true });
  fs.writeFileSync(path.join(out, 'svg', `${e.id}.svg`), svg(demo, 0, focus));
  const shots = Array.from({ length: 6 }, (_, i) => svg(demo, (total * i) / 6, focus, 150));
  return `<tr><td><b>${e.name}</b><br><small>${e.id} · ${demo.view ?? 'side'} · ${(total / 1000).toFixed(1)} s</small></td>${shots.map((s) => `<td>${s}</td>`).join('')}</tr>`;
});
Object.keys(DEMOS).forEach((id) => { if (!EX.some((e) => e.id === id)) problems.push(`${id}: demostración sin ejercicio`); });

fs.writeFileSync(path.join(out, 'demos.html'), `<!doctype html><meta charset="utf-8"><body style="background:#0A0A0B;color:#F5F5F5;font:13px system-ui;margin:16px">
<h2>Demostraciones VYTRON · ${EX.length} ejercicios · 6 instantes por ciclo</h2>
${problems.length ? `<pre style="color:#FF5A4E">${problems.join('\n')}</pre>` : '<p style="color:#B7FF36">Sin errores: todas tienen demostración y ninguna atraviesa el suelo.</p>'}
<table cellspacing=6>${rows.join('')}</table></body>`);
console.log(`${EX.length} ejercicios, ${Object.keys(DEMOS).length} demostraciones → ${path.join(out, 'demos.html')}`);
if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; }
