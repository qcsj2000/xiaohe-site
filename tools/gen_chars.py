"""生成 public/js/chars.js：GB2312 一级常用字里读音唯一的字，按词频取前 2600。
依赖：pip install pypinyin jieba
用法：python3 tools/gen_chars.py
- 不含 y / w / 零声母音节（这几类在 data.js 里手写，取键规则见 README）。
- 已出现在 data.js 手写题库（SRC / MORE）里的字不重复生成。
- 同时用 pypinyin 核对手写题库里每个字的读音，不一致会报错。
"""
import os, re, sys, jieba
from pypinyin import pinyin, Style

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIN = set('a o e i u v ai ei ao ou an en ang eng ong iong in ian iao ie iu ing uai iang uang ia ua uan un ue ve ui uo'.split())
INI = ['zh', 'ch', 'sh'] + list('bpmfdtnlgkhjqxrzcs')
TOP, PER_SYLLABLE = 2600, 14

freq = {}
for line in open(os.path.join(os.path.dirname(jieba.__file__), 'dict.txt'), encoding='utf8'):
    w, *r = line.split()
    if len(w) == 1 and r: freq[w] = int(r[0])

chars = []
for hi in range(0xB0, 0xD8):
    for lo in range(0xA1, 0xFF):
        if hi == 0xD7 and lo > 0xF9: break
        try: chars.append(bytes([hi, lo]).decode('gb2312'))
        except UnicodeDecodeError: pass

data_js = open(os.path.join(ROOT, 'public/js/data.js'), encoding='utf8').read()
mine, bad = {}, []
for name in ('SRC', 'MORE'):
    for l in re.search(r'const ' + name + r'=`(.*?)`;', data_js, re.S).group(1).split('\n'):
        ini, rest = l.split(':')
        for fin, cs in re.findall(r'([a-z]+)([\u4e00-\u9fff]+)', rest):
            for c in cs:
                s = (ini if ini != '_' else '') + fin
                mine.setdefault(c, set()).add(s)
                readings = {p.replace('ü', 'v') for p in pinyin(c, style=Style.NORMAL, heteronym=True)[0]}
                if s not in readings: bad.append((c, s, sorted(readings)))
if bad:
    sys.exit('手写题库里读音对不上：%s' % bad)

eligible = []
for c in chars:
    ps = {p.replace('ü', 'v') for p in pinyin(c, style=Style.NORMAL, heteronym=True)[0]}
    if len(ps) != 1: continue
    s = next(iter(ps)); ini = next((i for i in INI if s.startswith(i)), None)
    if ini and s[len(ini):] in FIN and freq.get(c, 0) > 0: eligible.append((c, ini, s[len(ini):]))
eligible.sort(key=lambda x: -freq[x[0]])

by = {}
for c, ini, fin in eligible[:TOP]:
    if c not in mine: by.setdefault((ini, fin), []).append(c)
lines = []
for ini in INI:
    parts = [f + ''.join(cs[:PER_SYLLABLE]) for (i, f), cs in sorted(by.items()) if i == ini]
    if parts: lines.append(ini + ':' + ' '.join(parts))
out = ("// 自动生成（tools/gen_chars.py）：GB2312 一级常用字中读音唯一的字（不含 y/w/零声母），按词频取前 %d，拼音由 pypinyin 核对。\n"
       "// 格式同 data.js：声母:韵母+字；v 代表 ü。\nexport const GEN = `%s`;\n") % (TOP, '\n'.join(lines))
open(os.path.join(ROOT, 'public/js/chars.js'), 'w', encoding='utf8').write(out)
print('写入 chars.js：%d 个字' % sum(min(len(cs), PER_SYLLABLE) for cs in by.values()))
