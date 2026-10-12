"""生成词表：
  public/js/words.js     常用二字词（按词频取前 2500）
  public/js/longwords.js 三字词（前 1200，来自词频表）和成语（前 1500）
二、三字词的拼音由 pypinyin 按词推断；成语取自 chinese-xinhua（MIT，首次运行会下载到 tools/.cache/），
只收词频表里也有的常用成语，拼音用成语表自带的。依赖：pip install pypinyin jieba；需要 node（读 data.js 里已有键序的音节，滤掉暂不支持的音节）。
用法：python3 tools/gen_words.py
"""
import json, os, subprocess, unicodedata, urllib.request, jieba
from pypinyin import pinyin, Style

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def supported():
    js = "import('file://%s/public/js/data.js').then(m=>console.log(JSON.stringify([...new Set(m.D.map(x=>x.p.replace('ü','v')))])))" % ROOT
    try: return set(json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], text=True)))
    except Exception: return None   # 没有 node 时不过滤，页面加载时仍会过滤

def common(c):  # GB2312 一级汉字：区位 0xB0–0xD7
    try: b = c.encode('gb2312')
    except UnicodeEncodeError: return False
    return len(b) == 2 and 0xB0 <= b[0] <= 0xD7

syl = supported()
IDIOM_URL = 'https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/idiom.json'
dic, jfreq = [], {}
for line in open(os.path.join(os.path.dirname(jieba.__file__), 'dict.txt'), encoding='utf8'):
    w, f, *_ = line.split()
    if len(w) == 4: jfreq[w] = int(f)
    if 2 <= len(w) <= 4 and all(common(c) for c in w) and len(set(w)) > 1: dic.append((w, int(f)))
dic.sort(key=lambda x: -x[1])

def build(n, top):
    out, seen = [], set()
    for w, _ in dic:
        if len(w) != n or w in seen: continue
        ps = [p[0].replace('ü', 'v') for p in pinyin(w, style=Style.NORMAL)]
        if len(ps) != n or (syl is not None and not all(p in syl for p in ps)): continue
        seen.add(w); out.append(w + ' ' + ' '.join(ps))
        if len(out) >= top: break
    return out

def toneless(p):
    for a in 'üǖǘǚǜ': p = p.replace(a, 'v')
    return ''.join(c for c in unicodedata.normalize('NFD', p) if unicodedata.category(c) != 'Mn')

def idioms(top):
    cache = os.path.join(ROOT, 'tools/.cache/idiom.json')
    if not os.path.exists(cache):
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        urllib.request.urlretrieve(IDIOM_URL, cache)
    cand = {}
    for e in json.load(open(cache, encoding='utf8')):
        w = e['word']
        if len(w) == 4 and jfreq.get(w, 0) > 0 and all(common(c) for c in w): cand[w] = e['pinyin']
    out = []
    for w in sorted(cand, key=lambda x: -jfreq[x]):
        ps = [toneless(p) for p in cand[w].split()]
        if len(ps) == 4 and (syl is None or all(p in syl for p in ps)):
            out.append(w + ' ' + ' '.join(ps))
            if len(out) >= top: break
    return out

w2, w3, w4 = build(2, 2500), build(3, 1200), idioms(1500)
def write(name, const, lines, note):
    open(os.path.join(ROOT, 'public/js', name), 'w', encoding='utf8').write(
        "// 自动生成（tools/gen_words.py）：%s；拼音由 pypinyin 按词推断。\n// 格式：词 拼音 拼音 …（v 代表 ü）\nexport const %s = `%s`;\n" % (note, const, '\n'.join(lines)))
write('words.js', 'WORDS', w2, '常用二字词，按词频取前 2500')
write('longwords.js', 'LONG', w3 + w4, '三字词（前 1200）和成语（前 1500，来自 chinese-xinhua）')
print('二字词 %d，三字词 %d，成语 %d' % (len(w2), len(w3), len(w4)))
