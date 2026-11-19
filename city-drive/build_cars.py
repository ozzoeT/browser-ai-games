"""Auto 3D di Kenney (Car Kit, CC0 - https://kenney.nl/assets/car-kit) per Afterglow GP.

Il gioco disegna ogni poligono a mano su canvas 2D, quindi i modelli vengono alleggeriti:
- i triangoli complanari, vicini e dello stesso colore diventano un solo poligono;
- spariscono le facce rivolte verso il basso (la telecamera sta sempre sopra le auto);
- il colore di ogni faccia viene preso dalla texture "colormap" di Kenney (le sfumature vengono raggruppate);
- le ruote (2/3 dei triangoli) diventano cilindri a 10 lati con gli stessi colori di gomma e cerchio;
- la vernice della carrozzeria diventa "P<luminosita'>", cosi' il gioco la ricolora col colore di ogni auto.
Il risultato viene scritto in index.html tra i marcatori /*CARS3D*/ ... /*/CARS3D*/.
Uso: python build_cars.py <cartella "Models/GLB format" del Car Kit>
"""
import colorsys, json, os, re, struct, sys
from collections import defaultdict
import numpy as np
from PIL import Image

# stesso ordine di MODELS nel gioco: VECTOR, MONOLITH, SPECTRE
CARS = ['sedan-sports', 'suv-luxury', 'race-future']


def load(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    return json.loads(b[20:20 + jl]), b[20 + jl + 8:]


def acc(J, B, i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    dt = np.dtype({5126: '<f4', 5125: '<u4', 5123: '<u2', 5121: 'u1'}[a['componentType']])
    st = bv.get('byteStride', n * dt.itemsize); off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    if st != n * dt.itemsize:
        return np.array([np.frombuffer(B, dt, n, off + k * st) for k in range(a['count'])])
    return np.frombuffer(B, dt, a['count'] * n, off).reshape(a['count'], n)


def local(nd):
    if 'matrix' in nd: return np.array(nd['matrix'], float).reshape(4, 4).T
    x, y, z, w = nd.get('rotation', [0, 0, 0, 1]); s = nd.get('scale', [1, 1, 1]); t = nd.get('translation', [0, 0, 0])
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4); M[:3, :3] = R * s; M[:3, 3] = t
    return M


def triangles(path, tex):
    """triangoli della carrozzeria nello spazio del mondo (colore letto dalla texture) e ruote come cilindri"""
    J, B = load(path); N = J['nodes']; out = []; wheels = []
    th, tw = tex.shape[:2]
    def walk(i, P):
        M = P @ local(N[i]); nd = N[i]
        if 'mesh' in nd:
            for pr in J['meshes'][nd['mesh']]['primitives']:
                pos = acc(J, B, pr['attributes']['POSITION']).astype(float)
                pos = (np.c_[pos, np.ones(len(pos))] @ M.T)[:, :3]
                uv = acc(J, B, pr['attributes']['TEXCOORD_0']).astype(float)
                idx = acc(J, B, pr['indices']).ravel().astype(int).reshape(-1, 3)
                if J['meshes'][nd['mesh']]['name'].startswith('wheel'):
                    cs = [tuple(int(c) for c in tex[min(th - 1, int(v % 1 * th)), min(tw - 1, int(u % 1 * tw))][:3]) for u, v in uv[idx].mean(1)]
                    wheels.append((pos.min(0), pos.max(0), cs)); continue
                for t in idx:
                    u, v = uv[t].mean(0)
                    col = tex[min(th - 1, max(0, int(v % 1 * th))), min(tw - 1, max(0, int(u % 1 * tw)))][:3]
                    out.append((pos[t], tuple(int(c) for c in col)))
        for c in nd.get('children', []): walk(c, M)
    for r in J['scenes'][J.get('scene', 0)]['nodes']: walk(r, np.eye(4))
    for lo, hi, cs in wheels:
        lum = lambda c: sum(c)
        cnt = defaultdict(int)
        for c in cs: cnt[c] += 1
        tire = min(cnt, key=lambda c: (lum(c), -cnt[c])) if cnt else (40, 40, 45)
        tire = max((c for c in cnt if lum(c) < lum(tire) + 60), key=lambda c: cnt[c])
        rim = max((c for c in cnt if lum(c) > lum(tire) + 90), key=lambda c: cnt[c], default=(180, 180, 190))
        c = (lo + hi) / 2; r = (hi[1] - lo[1]) / 2; hw = (hi[0] - lo[0]) / 2
        sd = 1 if c[0] > 0 else -1                                # lato esterno
        K = 10; ring = [np.array([0., np.cos(a) * r, np.sin(a) * r]) for a in np.arange(K) * 2 * np.pi / K + np.pi / K]
        ins, out_ = c + [-sd * hw, 0, 0], c + [sd * hw, 0, 0]
        for k in range(K):
            p, q = ring[k], ring[(k + 1) % K]
            quad = [ins + p, ins + q, out_ + q, out_ + p]
            if sd < 0: quad = quad[::-1]
            outv = np.cross(quad[1] - quad[0], quad[2] - quad[0])
            if outv @ ((p + q) / 2) < 0: quad = quad[::-1]
            out.append((np.array(quad[:3]), tire)); out.append((np.array([quad[0], quad[2], quad[3]]), tire))
        cap = [out_ + p * (1 if sd > 0 else 1) for p in ring]
        hub = [out_ + p * .62 + [sd * .002, 0, 0] for p in ring]
        for poly, col in ((cap, tire), (hub, rim)):
            pts = poly if (np.cross(poly[1] - poly[0], poly[2] - poly[0])[0] * sd) > 0 else poly[::-1]
            for k in range(1, K - 1): out.append((np.array([pts[0], pts[k], pts[k + 1]]), col))
    return out


def merge(tris):
    """unisce i triangoli complanari adiacenti dello stesso colore in poligoni (senza buchi)"""
    vid, V = {}, []
    def vi(p):
        k = tuple(np.round(p, 4))
        if k not in vid: vid[k] = len(V); V.append(p)
        return vid[k]
    groups = defaultdict(list)
    for pts, col in tris:
        n = np.cross(pts[1] - pts[0], pts[2] - pts[0]); a = np.linalg.norm(n)
        if a < 1e-9: continue
        n /= a
        if n[1] < -.35: continue                                  # sotto l'auto: non si vede mai
        ids = [vi(p) for p in pts]
        if len(set(ids)) < 3: continue
        key = (tuple(c // 14 for c in col), tuple(np.round(n, 2)), round(float(n @ pts[0]), 3))
        groups[key].append((ids, n, col))
    polys = []
    for (_, _, _), tl in groups.items():
        col = tl[0][2]
        # componenti connesse tramite spigoli condivisi
        edge = defaultdict(list)
        for i, (ids, _, _) in enumerate(tl):
            for e in range(3): edge[frozenset((ids[e], ids[(e + 1) % 3]))].append(i)
        seen = set()
        for s in range(len(tl)):
            if s in seen: continue
            comp, stack = [], [s]; seen.add(s)
            while stack:
                i = stack.pop(); comp.append(i); ids = tl[i][0]
                for e in range(3):
                    for j in edge[frozenset((ids[e], ids[(e + 1) % 3]))]:
                        if j not in seen: seen.add(j); stack.append(j)
            n = tl[comp[0]][1]
            # bordo: spigoli orientati che non hanno il gemello opposto
            de = set()
            for i in comp:
                ids = tl[i][0]
                for e in range(3): de.add((ids[e], ids[(e + 1) % 3]))
            bnd = [e for e in de if (e[1], e[0]) not in de]
            nxt = {}
            ok = True
            for a, b in bnd:
                if a in nxt: ok = False; break
                nxt[a] = b
            loop = []
            if ok and bnd:
                a0 = bnd[0][0]; a = a0
                while True:
                    loop.append(a); a = nxt.get(a)
                    if a is None or len(loop) > len(bnd): ok = False; break
                    if a == a0: break
                ok = ok and len(loop) == len(bnd)
            if ok:
                # via i punti allineati
                P = [np.array(V[i]) for i in loop]; keep = []
                for k in range(len(loop)):
                    d1 = P[k] - P[k - 1]; d2 = P[(k + 1) % len(P)] - P[k]
                    if np.linalg.norm(np.cross(d1, d2)) > 1e-6 * (np.linalg.norm(d1) * np.linalg.norm(d2) + 1e-12): keep.append(loop[k])
                polys.append((col, n, keep))
            else:
                for i in comp: polys.append((col, n, tl[i][0]))
    return V, polys


def paint_of(polys, V):
    """colore della vernice: il colore saturo con piu' superficie"""
    area = defaultdict(float)
    for col, n, ids in polys:
        h, l, s = colorsys.rgb_to_hls(*(c / 255 for c in col))
        if s < .35 or l < .2 or l > .85: continue
        P = np.array([V[i] for i in ids]); a = 0
        for k in range(1, len(P) - 1): a += np.linalg.norm(np.cross(P[k] - P[0], P[k + 1] - P[0])) / 2
        area[col] += a
    return max(area, key=area.get)


def build(path, tex):
    V, polys = merge(triangles(path, tex))
    V = np.array(V)
    paint = paint_of(polys, V)
    ph, pl, ps = colorsys.rgb_to_hls(*(c / 255 for c in paint))
    lo, hi = V.min(0), V.max(0)
    # spazio del gioco: ar = destra (-x del modello), y = su da terra, bf = avanti (+z), lunghezza normalizzata a 1
    L = hi[2] - lo[2]
    cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
    # ogni poligono viene allargato di GROW (in lunghezze d'auto) attorno al suo centro: i vicini si sovrappongono
    # e spariscono le fessure dell'antialiasing del canvas, senza costi durante il gioco
    GROW = .0035
    vid, verts = {}, []
    def vi(p):
        k = (round(-(p[0] - cx) / L, 4), round((p[1] - lo[1]) / L, 4), round((p[2] - cz) / L, 4))
        if k not in vid: vid[k] = len(verts) // 3; verts.extend(k)
        return vid[k]
    cols, ci, faces = [], {}, []
    for col, n, ids in polys:
        P = V[ids]; c = P.mean(0); d = P - c; dl = np.linalg.norm(d, axis=1, keepdims=True)
        P = P + d / np.maximum(dl, 1e-9) * GROW * L
        ids = [vi(p) for p in P]
        h, l, s = colorsys.rgb_to_hls(*(c / 255 for c in col))
        if s > .3 and min(abs(h - ph), 1 - abs(h - ph)) < .06: key = 'P%.2f' % (l / pl)
        else: key = '#%02x%02x%02x' % col
        if key not in ci: ci[key] = len(cols); cols.append(key)
        faces.append([ci[key], round(float(-n[0]), 2), round(float(n[1]), 2), round(float(n[2]), 2)] + ids)
    dims = [round(float((hi[0] - lo[0]) / L), 3), round(float((hi[1] - lo[1]) / L), 3)]
    return {'v': verts, 'c': cols, 'f': faces, 'wh': dims}, len(polys)


def main():
    src = sys.argv[1]
    tex = np.array(Image.open(os.path.join(src, 'Textures', 'colormap.png')).convert('RGB'))
    data = []
    for name in CARS:
        d, n = build(os.path.join(src, name + '.glb'), tex)
        data.append(d)
        print('  + %-14s %4d poligoni, %d vertici' % (name, n, len(d['v']) // 3))
    js = json.dumps(data, separators=(',', ':'))
    f = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')
    html = open(f, encoding='utf-8').read()
    block = '/*CARS3D*/const CARS3D=%s;/*/CARS3D*/' % js
    if '/*CARS3D*/' in html:
        html = re.sub(r'/\*CARS3D\*/.*?/\*/CARS3D\*/', lambda m: block, html, flags=re.S)
    else:
        raise SystemExit('marcatore /*CARS3D*/ non trovato in index.html')
    open(f, 'w', encoding='utf-8', newline='').write(html)
    print('scritto', f, len(js) // 1024, 'KB di modelli')


if __name__ == '__main__':
    main()
