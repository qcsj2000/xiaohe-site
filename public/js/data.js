import { GEN } from './chars.js';
import { WORDS } from './words.js';
import { LONG } from './longwords.js';

// 数据：声母:韵母+例字（v = ü；_ = 零声母）。双拼码由规则计算，不再手写。
const SRC=`b:a八 o波 i比 u不 ai白 ei杯 ao包 an半 en本 ang帮 eng崩 ie别 iao表 ian边 in宾 ing冰
p:a怕 o破 i皮 u普 ai拍 ei陪 ao跑 ou剖 an盘 en盆 ang旁 eng朋 ie撇 iao票 ian片 in品 ing平
m:a妈 o摸 e么 i米 u木 ai买 ei美 ao毛 ou某 an满 en门 ang忙 eng梦 ie灭 iao庙 ian面 in民 ing名 iu谬
f:a发 u夫 ei飞 ou否 an饭 en分 ang方 eng风
d:a大 e的 i地 u读 ai带 ao到 ou豆 an但 ang当 eng等 ong东 ie爹 iao掉 ian点 ing定 iu丢 uo多 ui对 uan短 un顿
t:a他 e特 i体 u土 ai太 ao桃 ou头 an谈 ang汤 eng疼 ong同 ie铁 iao条 ian天 ing听 uo拖 ui退 uan团 un吞
n:a那 e呢 i你 u奴 ai奶 ei内 ao脑 an难 en嫩 ang囊 eng能 ong农 ie捏 iao鸟 ian年 in您 iang娘 ing宁 iu牛 uo挪 uan暖 v女 ve虐
l:a拉 i里 u路 ai来 ei累 ao老 ou楼 an蓝 ang浪 eng冷 ong龙 ie列 iao料 ian连 in林 iang两 ing零 iu六 uo落 uan乱 un论 v绿 ve略
g:a嘎 e个 u古 ai该 ei给 ao高 ou够 an感 en根 ang刚 eng更 ong工 ua瓜 uo国 uai怪 ui贵 uan关 un滚 uang光
k:a卡 e可 u苦 ai开 ao考 ou口 an看 en肯 ang抗 eng坑 ong空 ua夸 uo扩 uai快 ui亏 uan宽 un困 uang况
h:a哈 e河 u湖 ai海 ei黑 ao好 ou后 an喊 en很 ang航 eng横 ong红 ua花 uo火 uai坏 ui回 uan环 un昏 uang黄
j:i几 u句 ia家 ie姐 iao教 ian见 in近 iang将 ing京 iong窘 iu九 ue决 uan卷 un军
q:i七 u去 ia恰 ie切 iao桥 ian前 in亲 iang强 ing请 iong穷 iu球 ue缺 uan全 un群
x:i西 u需 ia下 ie写 iao小 ian先 in心 iang想 ing星 iong兄 iu修 ue学 uan选 un寻
zh:i知 u住 a扎 e这 ai摘 ao找 ou周 an站 en真 ang张 eng正 ong中 ua抓 uo桌 uai拽 ui追 uan转 un准 uang装
ch:i吃 u出 a插 e车 ai柴 ao超 ou抽 an产 en沉 ang常 eng成 ong冲 uo戳 uai揣 ui吹 uan穿 un春 uang窗
sh:i是 u书 a啥 e蛇 ai晒 ao少 ou收 an山 en深 ang上 eng生 ua刷 uo说 uai帅 ui水 uan栓 un顺 uang双
r:i日 u如 e热 ao绕 ou肉 an然 en人 ang让 eng仍 ong容 uo若 ui瑞 uan软 un润
z:i自 u组 e则 ai在 ei贼 ao早 ou走 an赞 en怎 ang脏 eng增 ong总 uo做 ui最 uan钻 un尊
c:i次 u醋 e册 ai菜 ao草 ou凑 an餐 en岑 ang仓 eng层 ong从 uo错 ui脆 uan窜 un村
s:i四 u素 e色 ai塞 ao扫 ou搜 an三 en森 ang桑 eng僧 ong送 uo所 ui岁 uan酸 un孙
y:i一 in因 ing应 ong用 u于 ue月 uan远 un云
w:u无 a挖 ang王 o我
_:a啊 o哦 e饿 ai爱 ao奥 ou欧 an安 en恩 ang昂 er二`;
const FIN=Object.fromEntries('a:a o:o e:e i:i u:u v:v ai:d ei:w ao:c ou:z an:j en:f ang:h eng:g ong:s iong:s in:b ian:m iao:n ie:p iu:q ing:k uai:k iang:l uang:l ia:x ua:x uan:r un:y ue:t ve:t ui:v uo:o er:r'.split(' ').map(s=>s.split(':')));
const INI={sh:'u',ch:'i',zh:'v'};
// 零声母 = 首字母 + 韵母键（a o e 叠敲）；y/w 后按真实韵母取键（鱼 yv、蛙 wx、王 wl），其他音节 = 声母键 + 韵母键
const TF={y:{u:'v'},w:{a:'ua',ang:'uang'}};
const code=(i,f)=>i==='_'?(f==='er'?f:f.length<2?f+f:f[0]+FIN[f]):(INI[i]||i)+FIN[TF[i]?.[f]||f];
// 追加题库：同一个音节后面可以连写多个字，直接往下加即可
const MORE=`b:a爸吧 o播 i笔币毕 u布步部 ai拜败 ei北备 ao宝保报 an办班 en奔 ang棒 eng蹦 ie憋 iao标 ian变遍编 in彬 ing病并兵
p:a爬帕 o婆泼 i批匹 u谱浦 ai排派 ei配 ao抛袍 an判盼 ang胖 eng碰捧 iao瓢 ian偏骗 in拼贫 ing凭评
m:a马麻骂 o魔莫 i迷秘 u母目 ai埋卖 ei梅妹 ao猫帽 ou谋 an慢 en闷 ang芒 eng猛 iao妙 ian棉 in敏 ing明命
f:a法罚 u福服父 ei肥费 an反翻 en纷愤 ang房访 eng峰封
d:a达打 e德 i敌底 u杜度 ai代袋 ao道岛 ou斗 an蛋 ang党 eng灯邓 ong懂动 ie跌 iao雕 ian店电 ing顶 uo朵躲 ui队 uan段 un吨蹲
t:a塔踏 i提题 u图突 ai台抬 ao讨套 ou投 an坦叹 ang糖躺 eng腾 ong通统 ie贴 iao跳 ian田甜 ing停挺 uo托脱 ui腿 un屯
n:a拿纳 i泥逆 u努怒 ai耐 ao闹恼 an南 ong浓 ie聂 ian念 iang酿 ing拧 iu扭 uo诺
l:a啦 i立力礼 u鹿录 ai赖 ei雷 ao劳 ou漏 an懒 ang狼 ong隆 ie猎 iao聊 ian脸 in临 iang亮 ing灵 iu刘留 uo罗 un轮 v吕
g:e歌哥 u谷鼓 ai改盖 ao稿 ou狗 an赶干 ang钢 eng耕 ong公共 ua挂 uo锅果 uai拐 ui规 uan官管 un棍 uang广
k:e科课 u库裤 ao烤 ou扣 an砍 ang康 ong孔 ua垮 uai块 ui盔 uan款 un捆 uang狂
h:e何贺 u户护 ai孩 ao号 ou厚 an汉 en恨 ang杭 ong宏 ua华 uo活 uai怀 ui灰 uan换 un混 uang慌
j:i鸡急机 u举居 ia加甲 ie节街 iao交脚 ian间简 in金 iang江 ing经精 iu酒就 ue绝 un俊
q:i气起 u趣 iao巧 ian钱 in琴 iang墙 ing青 iu秋 ue确 uan泉
x:i希习 u许 ia虾 ie谢 iao笑 ian线 in新 iang香 ing姓 iong熊 iu休 ue雪 uan宣 un训
zh:i直只 u竹猪 a渣 e者 ai债 ao照 ou洲 an战 en阵 ang章 eng争 ong钟 uo捉 ui坠 uan砖 uang壮
ch:i迟 u除厨 a茶 e彻 ai拆 ao潮 an馋 en晨 ang场 eng程 ong虫 uai踹 ui锤 uan船 un纯 uang床
sh:i师十 u树束 a沙 e社 ai筛 ao烧 ou手 an闪 en身 ang伤 eng声 ua耍 uo硕 uai摔 ui睡 uan涮 un瞬 uang霜
r:u乳 e惹 ao饶 ou柔 an染 en仁 ang嚷 ong荣 uo弱 ui锐 un闰
z:i子字 u族 e泽 ai灾 ao造 ou邹 an暂 ang葬 ong宗 uo左 ui醉 un遵
c:i词刺 u粗 ai猜 ao操 an惨 ang苍 eng蹭 ong聪 uo措 ui翠 un存
s:i思死 u速 e瑟 ai赛 ao嫂 ou艘 an伞 ong宋 uo缩 ui碎 uan算 un损
y:i衣医 in音 ing影 ong永 u鱼语 ue越 uan院 un运
w:u五武 a娃 ang网旺 o窝
_:e鹅额 ai矮 ao傲 ou偶 an岸 ang盎 er耳儿`;
const D0=(SRC+'\n'+MORE+'\n'+GEN).split('\n').flatMap(l=>{const[i,r]=l.split(':');return[...r.matchAll(/([a-z]+)(\p{Script=Han}+)/gu)].flatMap(([,f,cs])=>[...cs].map(c=>({c,p:(i==='_'?f:i+f).replace('v','ü'),k:code(i,f)})))});
const _seen=new Set(),D=D0.filter((x)=>!_seen.has(x.c)&&_seen.add(x.c));
// 词组：每行「词 拼音 拼音」，只保留每个音节都在单字题库里有键序的词
const SYL=new Map(D.map((x)=>[x.p.replace('ü','v'),x.k]));
const parseWords=(s)=>s.split('\n').flatMap((l)=>{const[c,...ps]=l.split(' ');const ks=ps.map((p)=>SYL.get(p));return c&&ks.length&&ks.every(Boolean)?[{c,p:ps.join(' ').replace(/v/g,'ü'),k:ks.join('')}]:[]});
const W=parseWords(WORDS),WL=parseWords(LONG);
const ROWS=['qwertyuiop','asdfghjkl','zxcvbnm'];
// 解锁顺序：贪心——每次选能让可练音节增加最多的键
const ORDER=(()=>{const left=new Set(D.flatMap(x=>[...x.k])),got=new Set(),out=[];while(left.size){let best='',bs=-1;for(const k of left){const g=D.filter(x=>[...x.k].every(c=>got.has(c)||c===k)).length*1000+D.filter(x=>x.k.includes(k)).length;if(g>bs){bs=g;best=k}}got.add(best);left.delete(best);out.push(best)}return out})();

// 键位标签由映射反推
const fk={};for(const[f,k]of Object.entries(FIN))(fk[k]??=[]).push({v:'ü',ve:'üe'}[f]||f);
const label=k=>`声 ${'bpmfdtnlgkhjqxrzcsyw'.includes(k)?k:{u:'sh',i:'ch',v:'zh'}[k]||'—'}<br>韵 ${(fk[k]||['—']).join('/')}`;

// 官网键位图例字：橙｜绿
 const EX={q:'秋',w:'闱',r:'软',t:'|月',y:'云',u:'梳',i:'翅',p:'撇',s:'怂|恿',d:'带',f:'粉',g:'更',h:'航',j:'|安',k:'快|迎',l:'两|王',z:'揍',x:'夏|蛙',c:'草',v:'追|鱼',b:'滨',n:'鸟',m:'眠'};
const ex=k=>{const[o='',g='']=(EX[k]||'').split('|');return`<span class="o">${o}</span><span class="g">${g}</span>`};

export{D,W,WL,ROWS,ORDER,label,ex,EX,FIN,code};
