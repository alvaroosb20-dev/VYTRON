"""Genera las 6 capturas de tienda de VYTRON (1290×2796, iPhone 6,9")."""
import math, re, sys
from playwright.sync_api import sync_playwright

ROOT = __import__('os').path.dirname(__import__('os').path.dirname(__import__('os').path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/store/screenshots/ios-6.9'
src = open(f'{ROOT}/src/components/Icon.tsx').read()
PATHS = dict(re.findall(r"^\s+(\w+): '([^']+)'", src, re.M))
LOGO = open(f'{ROOT}/public/logo/vytron-logo.svg').read()
MARK_PATH = re.search(r'<path[^>]*/>', LOGO).group(0)

D = "'TeX Gyre Heros Cn'"  # sustituto local de Barlow Condensed


def ic(name, size=22, color='#F5F5F5', fill=False):
    f = color if fill else 'none'
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" style="flex:none"><path d="{PATHS[name]}" stroke="{color}" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="{f}"/></svg>')


def ring(value, size=112, stroke=10, inner=''):
    r = (size - stroke) / 2
    c = 2 * math.pi * r
    return (f'<div style="position:relative;width:{size}px;height:{size}px;flex:none">'
            f'<svg width="{size}" height="{size}" style="position:absolute;inset:0"><circle cx="{size/2}" cy="{size/2}" r="{r}" stroke="#2E2E33" stroke-width="{stroke}" fill="none"/>'
            f'<circle cx="{size/2}" cy="{size/2}" r="{r}" stroke="#B7FF36" stroke-width="{stroke}" stroke-linecap="round" fill="none" stroke-dasharray="{c} {c}" stroke-dashoffset="{c*(1-value)}" transform="rotate(-90 {size/2} {size/2})"/></svg>'
            f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">{inner}</div></div>')


CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:1290px;height:2796px;overflow:hidden;background:#0A0A0B;font-family:Inter,sans-serif;color:#F5F5F5}}
.bg{{position:absolute;inset:0;overflow:hidden}}
.glow{{position:absolute;width:1500px;height:1500px;border-radius:50%;background:radial-gradient(circle,rgba(183,255,54,.16),rgba(183,255,54,0) 62%);left:-105px;top:1050px}}
.slash{{position:absolute;right:-180px;top:-120px;opacity:.045}}
.head{{position:absolute;left:100px;right:100px;top:150px}}
.kicker{{display:flex;align-items:center;gap:22px;font:700 34px {D};letter-spacing:8px;color:#A0A0A8}}
h1{{font:700 150px/0.95 {D};letter-spacing:-1px;text-transform:uppercase;margin-top:44px}}
h1 em{{font-style:normal;color:#B7FF36}}
.sub{{font:400 50px/1.35 Inter;color:#A0A0A8;margin-top:40px;max-width:1050px}}
.phone{{position:absolute;left:145px;width:1000px;top:{{TOP}}px;height:2400px;border-radius:150px;background:#1C1C1F;padding:22px;box-shadow:0 0 0 3px #2E2E33}}
.screen{{width:956px;height:2356px;border-radius:130px;overflow:hidden;background:#0A0A0B;position:relative}}
.scale{{width:390px;transform:scale(2.4513);transform-origin:0 0;position:absolute;left:0;top:0}}
.status{{height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 30px 0 36px;font:600 16px Inter}}
.island{{position:absolute;left:50%;top:11px;width:120px;height:34px;margin-left:-60px;border-radius:20px;background:#000}}
.pad{{padding:8px 16px 0}}
.hero{{font:700 40px/1.02 {D};letter-spacing:.5px;text-transform:uppercase}}
.h1{{font:700 30px/1.1 {D};letter-spacing:.5px;text-transform:uppercase}}
.h2{{font:700 22px/1.15 {D};letter-spacing:.5px;text-transform:uppercase}}
.label{{font:600 12px Inter;letter-spacing:1.4px;color:#A0A0A8;text-transform:uppercase}}
.small{{font:400 13px/18px Inter;color:#A0A0A8}}
.body{{font:400 15px/22px Inter}}
.stat{{font:700 34px/1 {D}}}
.card{{background:#242428;border-radius:22px;padding:16px}}
.btn{{height:56px;border-radius:16px;background:#B7FF36;color:#0A0A0B;display:flex;align-items:center;justify-content:center;gap:8px;font:700 19px {D};letter-spacing:1.2px}}
.btn2{{height:56px;border-radius:16px;background:#171719;border:1px solid #2E2E33;display:flex;align-items:center;justify-content:center;gap:8px;font:700 19px {D};letter-spacing:1.2px}}
.pill{{display:inline-flex;padding:4px 10px;border-radius:99px;border:1px solid #2E2E33;font:600 11px Inter;letter-spacing:1px;color:#A0A0A8}}
.pill.n{{background:rgba(183,255,54,.12);border-color:rgba(183,255,54,.35);color:#B7FF36}}
.sec{{display:flex;justify-content:space-between;align-items:center;margin:24px 0 12px}}
.row{{display:flex;align-items:center;gap:12px}}
.line{{border-top:.5px solid #2E2E33}}
.tabbar{{position:absolute;left:0;right:0;top:{{TABTOP}}px;height:400px;background:#171719;border-top:.5px solid #2E2E33;display:flex;justify-content:space-around;padding-top:9px}}
.tab{{display:flex;flex-direction:column;align-items:center;gap:3px;font:600 11px Inter;color:#A0A0A8}}
"""


def tabbar(active):
    tabs = [('home', 'Inicio'), ('train', 'Entrenar'), ('food', 'Nutrición'), ('progress', 'Progreso'), ('profile', 'Perfil')]
    return '<div class="tabbar">' + ''.join(
        f'<div class="tab" style="color:{"#B7FF36" if t == active else "#A0A0A8"}">{ic(t, 22, "#B7FF36" if t == active else "#A0A0A8")}{l}</div>' for t, l in tabs) + '</div>'


STATUS = ('<div class="island"></div><div class="status"><span>9:41</span><span style="display:flex;gap:6px;align-items:center">'
          '<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#F5F5F5"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#F5F5F5"/><rect x="10" y="2" width="3" height="10" rx="1" fill="#F5F5F5"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#F5F5F5"/></svg>'
          '<svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" stroke="#F5F5F5" fill="none" opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill="#F5F5F5"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="#F5F5F5" opacity=".5"/></svg></span></div>')

# ---------------------------------------------------------------- pantallas
DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']


def s_plan():
    rows = [('Lun', 'EMPUJE', '55 min'), ('Mar', 'TRACCIÓN', '55 min'), ('Mié', None, ''), ('Jue', 'PIERNA', '60 min'),
            ('Vie', 'TORSO', '55 min'), ('Sáb', None, ''), ('Dom', None, '')]
    lst = ''.join(f'<div class="row {"line" if i else ""}" style="padding:12px 0"><span class="body" style="width:44px;color:#B7FF36">{d}</span>'
                  f'<span class="body" style="flex:1;color:{"#F5F5F5" if w else "#A0A0A8"}">{w or "Descanso"}</span><span class="small">{m}</span></div>'
                  for i, (d, w, m) in enumerate(rows))
    return f"""<div class="pad">
<span class="pill n">TU PLAN ESTÁ LISTO</span>
<div class="hero" style="margin-top:12px">GANAR MÚSCULO<br>EN 4 DÍAS</div>
<div class="row" style="margin-top:24px;gap:12px">
 <div style="flex:1"><div class="stat">4</div><div class="small">sesiones/sem</div></div>
 <div style="flex:1"><div class="stat">225</div><div class="small">min/sem</div></div>
 <div style="flex:1"><div class="stat">2.640</div><div class="small">kcal/día</div></div></div>
<div class="card" style="margin-top:16px;padding:8px 16px">{lst}</div>
<div class="small" style="margin-top:12px">Objetivo estimado: 2640 kcal · 130 g de proteína al día. Es una estimación, no un consejo médico.</div>
<div class="btn" style="margin-top:22px">EMPEZAR {ic('play', 18, '#0A0A0B', True)}</div>
</div>"""


def s_scan():
    items = [('Pechuga de pollo a la plancha', 150, 248, '46 g P'), ('Arroz blanco', 180, 234, '51 g HC'), ('Brócoli', 90, 31, '3 g P'), ('Aceite de oliva', 8, 72, '8 g G')]
    lst = ''.join(f'<div class="row {"line" if i else ""}" style="padding:11px 0"><div style="flex:1"><div class="body">{n}</div>'
                  f'<div class="small">{g} g · {x}</div></div><div class="h2" style="font-size:20px">{k}</div><span class="small" style="margin-left:-6px">kcal</span></div>'
                  for i, (n, g, k, x) in enumerate(items))
    plate = ('<div style="height:210px;border-radius:22px;background:#171719;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">'
             '<div style="width:176px;height:176px;border-radius:50%;background:#EDEAE2;box-shadow:inset 0 0 0 14px #F7F5F0;position:relative">'
             '<div style="position:absolute;left:34px;top:36px;width:70px;height:58px;border-radius:40% 55% 45% 50%;background:#C98B4B;transform:rotate(-14deg)"></div>'
             '<div style="position:absolute;left:44px;top:46px;width:50px;height:6px;border-radius:3px;background:#8A5524;transform:rotate(-14deg);opacity:.6"></div>'
             '<div style="position:absolute;left:46px;top:60px;width:44px;height:5px;border-radius:3px;background:#8A5524;transform:rotate(-14deg);opacity:.6"></div>'
             '<div style="position:absolute;right:28px;top:40px;width:66px;height:62px;border-radius:50%;background:#FBFAF6;box-shadow:inset -6px -6px 0 #E9E5DA"></div>'
             + ''.join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{s}px;height:{s}px;border-radius:50%;background:#3E8E3A;box-shadow:inset -3px -3px 0 #2C6B2A"></div>'
                       for x, y, s in [(50, 106, 26), (72, 116, 30), (98, 108, 24), (88, 96, 20)]) +
             '</div><div style="position:absolute;inset:18px;border:2px solid #B7FF36;border-radius:16px;opacity:.9"></div>'
             '<div style="position:absolute;left:18px;right:18px;top:118px;height:2px;background:#B7FF36;box-shadow:0 0 12px #B7FF36"></div></div>')
    return f"""<div class="pad">
<div class="row" style="justify-content:space-between;margin-bottom:12px">{ic('close', 22, '#A0A0A8')}<span class="label">ESCÁNER DE COMIDAS</span><span style="width:22px"></span></div>
{plate}
<div class="card" style="margin-top:16px">
 <div class="label">ESTIMACIÓN · CONFIANZA ALTA</div>
 <div class="row" style="margin-top:10px;align-items:flex-end"><div class="stat" style="font-size:46px">585</div><span class="small" style="margin-bottom:6px">kcal en total</span></div>
 <div class="row" style="margin-top:12px;gap:8px">
  {''.join(f'<div style="flex:1;background:#171719;border-radius:12px;padding:8px 10px"><div class="h2" style="font-size:20px">{v}</div><div class="small" style="font-size:11px">{l}</div></div>' for v, l in [('52 g', 'proteína'), ('54 g', 'hidratos'), ('17 g', 'grasa')])}
 </div>
 <div style="margin-top:8px">{lst}</div>
</div>
<div class="btn" style="margin-top:16px">{ic('check', 18, '#0A0A0B')} GUARDAR EN COMIDA</div>
</div>"""


def s_workout():
    def sets(rows):
        h = '<div class="row small" style="font-size:11px;letter-spacing:1px;padding:8px 0 4px"><span style="width:34px">SERIE</span><span style="flex:1;text-align:center">KG</span><span style="flex:1;text-align:center">REPS</span><span style="width:40px"></span></div>'
        for i, (kg, reps, done) in enumerate(rows):
            box = 'background:#171719;border:1px solid #2E2E33;border-radius:10px;height:40px;display:flex;align-items:center;justify-content:center;font:600 16px Inter;flex:1'
            chk = (f'<div style="width:40px;height:40px;border-radius:12px;background:{"#B7FF36" if done else "#171719"};border:1px solid {"#B7FF36" if done else "#2E2E33"};display:flex;align-items:center;justify-content:center">'
                   f'{ic("check", 20, "#0A0A0B" if done else "#55555C")}</div>')
            h += f'<div class="row" style="gap:8px;padding:4px 0;{"opacity:1" if done else ""}"><span class="h2" style="width:34px;font-size:18px;color:{"#B7FF36" if done else "#A0A0A8"}">{i+1}</span><div style="{box}">{kg}</div><div style="{box}">{reps}</div>{chk}</div>'
        return h
    return f"""<div class="pad">
<div class="row" style="justify-content:space-between">{ic('close', 22, '#A0A0A8')}<span class="h2" style="font-size:24px;letter-spacing:1px">32:14</span><span class="pill n">5/14</span></div>
<div class="hero" style="margin-top:16px">EMPUJE</div>
<div class="small" style="margin-top:4px">Pecho, hombro y tríceps · 55 min</div>
<div class="card" style="margin-top:18px">
 <div class="row"><div style="flex:1"><div class="h2">Press de banca</div><div class="small">4 × 6-8 · descanso 2:30</div></div><span class="pill n">1RM 98 KG</span></div>
 <div class="row" style="margin-top:12px;gap:8px;background:rgba(183,255,54,.08);border:1px solid rgba(183,255,54,.3);border-radius:12px;padding:10px 12px">{ic('spark', 18, '#B7FF36')}<span class="small" style="color:#F5F5F5;flex:1">Hoy prueba con <b style="color:#B7FF36;font-weight:600">80 kg</b>: la última vez completaste todas las series.</span></div>
 {sets([('80', '8', True), ('80', '8', True), ('80', '7', False), ('80', '6', False)])}
</div>
<div class="card" style="margin-top:12px;display:flex;align-items:center;gap:16px">
 {ring(0.62, 64, 6, '<span class="h2" style="font-size:18px">1:33</span>')}
 <div style="flex:1"><div class="label">DESCANSO</div><div class="body" style="margin-top:2px">Siguiente: serie 3</div></div>
 <span class="pill">+30 s</span>
</div>
</div>"""


def s_progress():
    bars = [4, 4, 4, 5, 4, 4, 4, 3]
    labels = ['25/8', '1/9', '8/9', '15/9', '22/9', '29/9', '6/10', '13/10']
    goal = 4
    chart = ('<div style="position:relative;height:120px;display:flex;align-items:flex-end;gap:8px;margin-top:6px">'
             f'<div style="position:absolute;left:0;right:0;bottom:{goal/5*120}px;border-top:1.5px dashed #A0A0A8;opacity:.6"></div>'
             + ''.join(f'<div style="flex:1;height:{v/5*120}px;border-radius:6px;background:{"#B7FF36" if v >= goal else "#3A3A40"}"></div>' for v in bars) + '</div>'
             '<div style="display:flex;gap:8px;margin-top:6px">' + ''.join(f'<span class="small" style="flex:1;text-align:center;font-size:10px">{l}</span>' for l in labels) + '</div>')
    prs = [('Press de banca', '82,5 kg × 6', '98'), ('Sentadilla', '110 kg × 5', '128'), ('Peso muerto', '140 kg × 3', '154')]
    prl = ''.join(f'<div class="row {"line" if i else ""}" style="padding:11px 0">{ic("trophy", 18, "#B7FF36")}<div style="flex:1"><div class="body">{n}</div><div class="small">{s}</div></div>'
                  f'<div style="text-align:right"><div class="h2" style="font-size:20px">{r} kg</div><div class="small" style="font-size:11px">1RM est.</div></div></div>' for i, (n, s, r) in enumerate(prs))
    return f"""<div class="pad">
<div class="h1">PROGRESO</div>
<div class="row" style="gap:8px;margin-top:16px">
 {''.join(f'<div style="flex:1;background:#242428;border-radius:16px;padding:12px"><div class="stat" style="font-size:26px">{v}</div><div class="label" style="font-size:10px;margin-top:4px">{l}</div></div>' for v, l in [('3/4', 'ESTA SEMANA'), ('7 sem', 'RACHA'), ('31', 'SESIONES')])}
</div>
<div class="sec"><span class="label">SESIONES POR SEMANA · ÚLTIMAS 8</span></div>
<div class="card">{chart}<div class="small" style="margin-top:10px">La línea marca tu objetivo semanal.</div></div>
<div class="sec"><span class="label">MARCAS PERSONALES</span></div>
<div class="card" style="padding:4px 16px">{prl}</div>
<div class="sec"><span class="label">INFORME MENSUAL</span></div>
<div class="card row" style="gap:12px">
 {''.join(f'<div style="flex:1"><div class="stat" style="font-size:24px">{v}</div><div class="small" style="color:#B7FF36;font-weight:600">{d}</div><div class="label" style="font-size:10px;margin-top:2px">{l}</div></div>' for v, d, l in [('15', '+3', 'SESIONES'), ('41.280', '+6.900', 'KG VOLUMEN'), ('11,6 h', '+2,1 h', 'TIEMPO')])}
</div>
</div>{tabbar('progress')}"""


def s_nutrition():
    meals = [('DESAYUNO · 520 KCAL', [('Avena con plátano y crema de cacahuete', '72 g · 9:10', 412), ('Café con leche', '250 ml', 108)]),
             ('COMIDA · 585 KCAL', [('Pollo con arroz y brócoli', 'Escaneado · 14:02', 585)])]
    ml = ''
    for t, its in meals:
        ml += f'<div class="sec"><span class="label">{t}</span></div><div class="card" style="padding:4px 16px">'
        ml += ''.join(f'<div class="row {"line" if i else ""}" style="padding:11px 0"><div style="flex:1"><div class="body">{n}</div><div class="small">{s}</div></div><div class="h2" style="font-size:18px">{k}</div></div>' for i, (n, s, k) in enumerate(its))
        ml += '</div>'
    macro = lambda n, v, t, c: (f'<div style="flex:1"><div class="small" style="color:#F5F5F5">{n}</div><div class="small" style="font-size:12px">{v} / {t} g</div>'
                                f'<div style="height:6px;border-radius:3px;background:#171719;margin-top:6px;overflow:hidden"><div style="height:100%;width:{v/t*100}%;background:{c};border-radius:3px"></div></div></div>')
    return f"""<div class="pad">
<div class="row" style="justify-content:space-between"><div class="h1">NUTRICIÓN</div><span class="label" style="color:#F5F5F5">HOY</span></div>
<div class="card" style="margin-top:16px">
 <div class="row" style="gap:20px">{ring(1105/2640, 112, 10, '<div class="stat" style="font-size:28px">1.105</div><div class="small" style="font-size:11px">de 2.640</div>')}
  <div style="flex:1"><div class="h2">QUEDAN 1535 KCAL</div><div class="small" style="margin-top:4px">Objetivo para ganar músculo con 4 entrenos a la semana.</div></div></div>
 <div class="row" style="gap:12px;margin-top:18px">{macro('Proteína', 82, 130, '#B7FF36')}{macro('Hidratos', 128, 330, '#F5F5F5')}{macro('Grasa', 36, 79, '#A0A0A8')}</div>
</div>
<div class="row" style="gap:8px;margin-top:16px"><div class="btn" style="flex:1">{ic('camera', 18, '#0A0A0B')} ESCANEAR COMIDA</div><div class="btn2" style="width:56px">{ic('plus', 20)}</div></div>
{ml}
</div>{tabbar('food')}"""


def s_streak():
    days = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    trained = [True, True, False, True, False, False, False]
    strip = ''.join(f'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px"><span class="small" style="font-size:11px">{d}</span>'
                    f'<div style="width:34px;height:34px;border-radius:17px;background:{"#B7FF36" if t else "transparent"};border:{"2px solid #F5F5F5" if i == 4 else "1px solid #2E2E33"};display:flex;align-items:center;justify-content:center">{ic("check", 16, "#0A0A0B") if t else ""}</div></div>'
                    for i, (d, t) in enumerate(zip(days, trained)))
    badges = [('play', 'PRIMER PASO', 1), ('target', 'SEMANA CUMPLIDA', 1), ('train', 'CONSTANCIA', 1), ('flame', 'UN MES SIN FALLAR', 1), ('calendar', 'HÁBITO', .72), ('flame', 'IMPARABLE', .58)]
    bd = ''.join(f'<div style="width:31.5%;background:#242428;border-radius:16px;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;{"opacity:.55" if v < 1 else ""}">'
                 f'<div style="width:40px;height:40px;border-radius:20px;background:{"#B7FF36" if v >= 1 else "#171719"};display:flex;align-items:center;justify-content:center">{ic(i if v >= 1 else "lock", 18, "#0A0A0B" if v >= 1 else "#A0A0A8")}</div>'
                 f'<span class="label" style="font-size:10px;color:{"#F5F5F5" if v >= 1 else "#A0A0A8"};text-align:center">{t}</span>'
                 + (f'<div style="align-self:stretch;height:4px;border-radius:2px;background:#171719;overflow:hidden"><div style="height:100%;width:{v*100}%;background:#B7FF36"></div></div>' if v < 1 else '')
                 + '</div>' for i, t, v in badges)
    notif = ('<div style="position:absolute;left:10px;right:10px;top:58px;z-index:5;background:rgba(40,40,44,.97);border-radius:22px;padding:12px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.5)">'
             '<div style="width:38px;height:38px;border-radius:9px;background:#0A0A0B;display:flex;align-items:center;justify-content:center;flex:none">'
             f'<svg width="22" height="26" viewBox="19 -2 94 120">{MARK_PATH}</svg></div>'
             '<div style="flex:1"><div class="row" style="justify-content:space-between"><span style="font:600 14px Inter">VYTRON</span><span class="small" style="font-size:12px">ahora</span></div>'
             '<div style="font:600 14px/19px Inter;margin-top:2px">Tu racha de 7 semanas está en juego</div><div style="font:400 14px/19px Inter;color:#D0D0D6">Te falta 1 sesión para cumplir tu objetivo semanal.</div></div></div>')
    return f"""{notif}<div class="pad" style="padding-top:130px">
<div class="card">
 <div class="row" style="gap:20px">{ring(3/4, 112, 10, '<div class="stat">3<span class="small">/4</span></div>')}
  <div style="flex:1"><div class="h2">TE QUEDA 1 SESIÓN</div><div class="row" style="gap:6px;margin-top:6px">{ic('flame', 16, '#B7FF36')}<span class="small" style="flex:1">7 semanas seguidas cumpliendo</span></div></div></div>
 <div class="row" style="margin-top:20px;gap:0">{strip}</div>
</div>
<div class="sec"><span class="label">LOGROS · 4/10</span></div>
<div style="display:flex;flex-wrap:wrap;gap:8px">{bd}</div>
</div>{tabbar('progress')}"""


SHOTS = [
    ('01-plan', 'TU PLAN A MEDIDA', 'Tu <em>plan</em><br>a medida en<br>60 segundos', 'Dinos tu objetivo, tus días y tu material. VYTRON organiza tu semana y calcula tus calorías.', s_plan),
    ('02-escaner', 'ESCÁNER CON IA', 'Haz una foto.<br><em>Calorías</em><br>al instante', 'La IA reconoce tu plato y estima calorías y macros. Tú revisas y guardas.', s_scan),
    ('03-entreno', 'ENTRENA MEJOR', 'Cada serie<br><em>cuenta</em>', 'Registra peso y repeticiones, controla el descanso y recibe la carga que toca hoy.', s_workout),
    ('04-progreso', 'PROGRESO REAL', 'Mira cómo<br><em>evolucionas</em>', 'Marcas personales, 1RM estimado y tu constancia semana a semana.', s_progress),
    ('05-nutricion', 'NUTRICIÓN', 'Tus macros,<br><em>sin líos</em>', 'Un objetivo diario a tu medida y tu diario de comidas en un vistazo.', s_nutrition),
    ('06-racha', 'CONSTANCIA', 'No rompas<br>tu <em>racha</em>', 'Recordatorios los días que toca, rachas semanales y logros que desbloquear.', s_streak),
]


def page(kicker, title, sub, screen, top):
    return f"""<html><head><meta charset="utf-8"><style>{CSS.replace('{TOP}', str(top)).replace('{TABTOP}', str(int((2796 - top - 22) / 2.4513) - 78))}</style></head><body>
<div class="bg"><div class="glow"></div><svg class="slash" width="900" height="980" viewBox="19 -2 94 120">{MARK_PATH.replace('#B7FF36', '#F5F5F5')}</svg></div>
<div class="head"><div class="kicker"><svg width="30" height="38" viewBox="19 -2 94 120">{MARK_PATH}</svg>{kicker}</div>
<h1>{title}</h1><div class="sub">{sub}</div></div>
<div class="phone"><div class="screen"><div class="scale" style="height:844px">{STATUS}{screen()}</div></div></div>
</body></html>"""


if __name__ == '__main__':
    only = sys.argv[2:] or None
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1290, 'height': 2796})
        for slug, kicker, title, sub, fn in SHOTS:
            if only and slug not in only:
                continue
            lines = title.count('<br>') + 1
            top = 150 + 38 + 44 + lines * 143 + 40 + 2 * 68 + 90
            pg.set_content(page(kicker, title, sub, fn, top))
            pg.wait_for_timeout(250)
            pg.screenshot(path=f'{OUT}/vytron-{slug}.png')
            print('ok', slug, top)
        b.close()
