import { ROWS, label, ex } from './data.js';
document.getElementById('kb').innerHTML = ROWS.map((r) => `<div class="kr">${[...r].map((k) => `<div class="k" data-k="${k}"><b>${k}</b><s>${ex(k)}</s><i>${label(k)}</i></div>`).join('')}</div>`).join('');
