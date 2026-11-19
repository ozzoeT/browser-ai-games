"""Kart di Kenney (Car Kit, CC0 - https://kenney.nl/assets/car-kit) per Rollway.

Per ogni kart salva i pezzi separati (scocca, pilota, 4 ruote) cosi' il gioco puo' far girare le ruote
e inclinare il pilota. Il colore di ogni vertice viene preso dalla texture "colormap" di Kenney
(tavolozza condivisa), le normali restano quelle piatte del modello.
Le forme uguali tra kart diversi (scocche, ruote) vengono salvate una volta sola; i numeri sono compressi
in base64: posizioni Int16 (/Q), normali Int8 (/127), indici Uint16, colori Uint16 (indice nella tavolozza).
Il risultato viene scritto in index.html tra i marcatori /*KARTS*/ ... /*/KARTS*/.
Uso: python build_karts.py <cartella "Models/GLB format" del Car Kit>
"""
import base64, json, os, re, struct, sys
import numpy as np
from PIL import Image

KARTS = ['kart-oobi', 'kart-oodi', 'kart-ooli', 'kart-oopi', 'kart-oozi']
Q = 16000  # unita' del modello -> Int16


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


b64 = lambda a: base64.b64encode(a.tobytes()).decode()


def main():
    src = sys.argv[1]
    tex = np.array(Image.open(os.path.join(src, 'Textures', 'colormap.png')).convert('RGB')); th, tw = tex.shape[:2]
    pal, pi, geos, gi, karts = [], {}, [], {}, {}
    for name in KARTS:
        J, B = load(os.path.join(src, name + '.glb')); parts = []
        for nd in J['nodes']:
            if 'mesh' not in nd: continue
            kind = 'wheel' if nd['name'].startswith('wheel') else 'pilot' if nd['name'] == 'character' else 'body'
            P, N, C, I = [], [], [], []
            for pr in J['meshes'][nd['mesh']]['primitives']:
                pos = acc(J, B, pr['attributes']['POSITION']).astype(float)
                nor = acc(J, B, pr['attributes']['NORMAL']).astype(float)
                uv = acc(J, B, pr['attributes']['TEXCOORD_0']).astype(float)
                I.append(acc(J, B, pr['indices']).ravel().astype(int) + sum(len(p) for p in P))
                for u, v in uv:
                    key = '%02x%02x%02x' % tuple(int(c) for c in tex[min(th - 1, max(0, int(v % 1 * th))), min(tw - 1, max(0, int(u % 1 * tw)))][:3])
                    if key not in pi: pi[key] = len(pal); pal.append(key)
                    C.append(pi[key])
                # Rollway: avanti = -z, quindi il kart (avanti = +z) viene girato di 180 gradi
                P.append(pos * [-1, 1, -1]); N.append(nor * [-1, 1, -1])
            P, N, I = np.concatenate(P), np.concatenate(N), np.concatenate(I)
            g = {'p': b64(np.round(P * Q).astype('<i2')), 'n': b64(np.round(N * 127).astype('i1')), 'i': b64(I.astype('<u2'))}
            gk = g['p'] + g['i']
            if gk not in gi: gi[gk] = len(geos); geos.append(g)
            t = nd.get('translation', [0, 0, 0])
            parts.append({'k': kind, 'g': gi[gk], 'c': b64(np.array(C, '<u2')), 't': [round(-t[0], 4), round(t[1], 4), round(-t[2], 4)]})
        karts[name] = parts
        print('  + %-10s %d pezzi' % (name, len(parts)))
    data = {'q': Q, 'pal': pal, 'geo': geos, 'karts': karts}
    js = json.dumps(data, separators=(',', ':'))
    f = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')
    html = open(f, encoding='utf-8').read()
    block = '/*KARTS*/const KARTS=%s;/*/KARTS*/' % js
    if '/*KARTS*/' not in html: raise SystemExit('marcatore /*KARTS*/ non trovato in index.html')
    html = re.sub(r'/\*KARTS\*/.*?/\*/KARTS\*/', lambda m: block, html, flags=re.S)
    open(f, 'w', encoding='utf-8', newline='').write(html)
    print('%d forme uniche, %d colori, scritto %s (%d KB di modelli)' % (len(geos), len(pal), f, len(js) // 1024))


if __name__ == '__main__':
    main()
