'use strict';
// Hyrox: 8 x (1 km Lauf + Station)
const STATIONS = [
  {id:'ski',  name:'SkiErg',            unit:'1000 m'},
  {id:'push', name:'Sled Push',         unit:'50 m'},
  {id:'pull', name:'Sled Pull',         unit:'50 m'},
  {id:'bbj',  name:'Burpee Broad Jumps',unit:'80 m'},
  {id:'row',  name:'Rudern',            unit:'1000 m'},
  {id:'carry',name:'Farmers Carry',     unit:'200 m'},
  {id:'lunge',name:'Sandbag Lunges',    unit:'100 m'},
  {id:'wb',   name:'Wall Balls',        unit:'100 Wdh.'}
];
// Gewichte je Division: Sled Push/Pull gesamt kg, Farmers (je Hand), Sandbag, Wall Ball (kg / Zielhöhe)
const DIVISIONS = {
  'Open Männer': {push:152, pull:103, carry:'2×24 kg', lunge:'20 kg', wb:'6 kg / 3,00 m'},
  'Open Frauen': {push:102, pull:78,  carry:'2×16 kg', lunge:'10 kg', wb:'4 kg / 2,70 m'},
  'Pro Männer':  {push:202, pull:153, carry:'2×32 kg', lunge:'30 kg', wb:'9 kg / 3,00 m'},
  'Pro Frauen':  {push:152, pull:103, carry:'2×24 kg', lunge:'20 kg', wb:'6 kg / 2,70 m'}
};
// Relative Zeitanteile der 8 Stationen an der Stationsgesamtzeit (Näherung)
const STATION_WEIGHT = [0.12,0.10,0.11,0.14,0.12,0.08,0.15,0.18];

// Segmente: Run1, Station1, Run2, ...
const SEGMENTS = STATIONS.flatMap((s,i)=>[
  {type:'run', name:`Lauf ${i+1}`, unit:'1 km'},
  {type:'station', name:s.name, unit:s.unit, idx:i, id:s.id}
]);

const $ = s => document.querySelector(s);
const fmt = (ms, h=false) => {
  const t = Math.floor(ms/1000), hh = Math.floor(t/3600), mm = Math.floor(t%3600/60), ss = t%60;
  const p = n => String(n).padStart(2,'0');
  return (h||hh) ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
};
const load = (k,d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));

// ---------- Division ----------
const divSel = $('#division');
Object.keys(DIVISIONS).forEach(d => divSel.add(new Option(d,d)));
divSel.value = load('division','Open Männer');
divSel.onchange = () => { save('division', divSel.value); renderStd(); };

// ---------- Tabs ----------
document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
  document.querySelectorAll('nav button,.tab').forEach(e => e.classList.remove('active'));
  b.classList.add('active'); $('#tab-'+b.dataset.tab).classList.add('active');
  if (b.dataset.tab==='hist') renderHist();
});

// ---------- Pacing ----------
function parseGoal(s){
  const m = s.trim().match(/^(\d+):(\d{1,2})$/);
  return m ? (+m[1]*60 + +m[2])*60000 : null;
}
function plan(goalMs, runPct){
  const runTotal = goalMs*runPct/100, stTotal = goalMs-runTotal;
  return SEGMENTS.map(s => s.type==='run' ? runTotal/8 : stTotal*STATION_WEIGHT[s.idx]);
}
function renderPace(){
  const goal = parseGoal($('#goal').value), pct = +$('#runPct').value;
  $('#runPctLabel').textContent = pct;
  const t = $('#paceTable');
  if (!goal){ t.innerHTML = '<tr><td>Zielzeit als h:mm eingeben</td></tr>'; return; }
  const p = plan(goal, pct); let cum = 0;
  t.innerHTML = '<tr><th>Segment</th><th>Split</th><th>Kumuliert</th></tr>' +
    SEGMENTS.map((s,i)=>{cum+=p[i];return `<tr><td>${s.name}</td><td>${fmt(p[i])}</td><td>${fmt(cum)}</td></tr>`}).join('');
  const km = p.filter((_,i)=>SEGMENTS[i].type==='run')[0];
  t.innerHTML += `<tr><th colspan="3">Lauf-Pace: ${fmt(km)} min/km</th></tr>`;
}
$('#goal').oninput = $('#runPct').oninput = () => { save('goal',$('#goal').value); renderPace(); };
$('#goal').value = load('goal','1:30');

// ---------- Standards ----------
function renderStd(){
  const d = DIVISIONS[divSel.value];
  const val = {ski:'—',push:d.push+' kg',pull:d.pull+' kg',bbj:'—',row:'—',carry:d.carry,lunge:d.lunge,wb:d.wb};
  $('#stdTable').innerHTML = '<tr><th>Station</th><th>Distanz</th><th>Gewicht</th></tr>' +
    STATIONS.map(s=>`<tr><td>${s.name}</td><td>${s.unit}</td><td>${val[s.id]}</td></tr>`).join('');
}

// ---------- Race ----------
let race = load('race', null); // {start, splits:[ms timestamps], running}
const ui = {
  render(){
    const idx = race ? race.splits.length : 0;
    const done = idx >= SEGMENTS.length;
    $('#mainBtn').textContent = !race ? 'START' : done ? 'FERTIG – SPEICHERN' : 'NÄCHSTES SEGMENT';
    $('#currentLabel').textContent = !race ? 'Bereit' : done ? 'Im Ziel!' : `${SEGMENTS[idx].name} · ${SEGMENTS[idx].unit}`;
    const goal = parseGoal($('#goal').value);
    const p = goal ? plan(goal, +$('#runPct').value) : null;
    let prev = race ? race.start : 0;
    $('#splits').innerHTML = SEGMENTS.map((s,i)=>{
      const cls = (s.type==='station'?'station ':'') + (i===idx && race ? 'cur' : '');
      let t = '', extra = '';
      if (race && i < idx){ const d = race.splits[i]-prev; prev = race.splits[i]; t = fmt(d);
        if (p){ const diff = d - p[i]; extra = `<small style="color:var(--${diff<=0?'ok':'bad'})">${diff<=0?'-':'+'}${fmt(Math.abs(diff))}</small>`; } }
      return `<li class="${cls}"><span>${s.name}</span><span>${t}${extra}</span></li>`;
    }).join('');
  },
  tick(){
    if (!race){ return; }
    const now = Date.now(), idx = race.splits.length;
    const last = idx ? race.splits[idx-1] : race.start;
    const end = idx >= SEGMENTS.length ? race.splits[idx-1] : now;
    $('#totalClock').textContent = fmt(end - race.start, true);
    $('#segClock').textContent = idx >= SEGMENTS.length ? '' : fmt(now - last);
    const goal = parseGoal($('#goal').value);
    if (goal && idx < SEGMENTS.length){
      const p = plan(goal, +$('#runPct').value);
      const target = p.slice(0,idx+1).reduce((a,b)=>a+b,0);
      const diff = (now - race.start) - target;
      const el = $('#delta'); el.className = 'delta ' + (diff<=0?'ok':'bad');
      el.textContent = `${diff<=0?'Vorsprung':'Rückstand'} ${fmt(Math.abs(diff))} zum Segmentende-Plan`;
    }
  }
};
$('#mainBtn').onclick = () => {
  if (!race){ race = {start:Date.now(), splits:[]}; }
  else if (race.splits.length < SEGMENTS.length){ race.splits.push(Date.now()); navigator.vibrate?.(60); }
  else { finish(); return; }
  save('race', race); ui.render(); ui.tick();
};
$('#undoBtn').onclick = () => { if (race?.splits.length){ race.splits.pop(); save('race',race); ui.render(); ui.tick(); } };
$('#resetBtn').onclick = () => { if (race && confirm('Rennen verwerfen?')){ race=null; localStorage.removeItem('race'); $('#totalClock').textContent='00:00:00'; $('#segClock').textContent='00:00'; $('#delta').textContent=''; ui.render(); } };
function finish(){
  const hist = load('history', []); let prev = race.start;
  hist.unshift({date:new Date().toISOString(), division:divSel.value, total:race.splits.at(-1)-race.start,
    splits:race.splits.map(t=>{const d=t-prev;prev=t;return d;})});
  save('history', hist); race=null; localStorage.removeItem('race');
  $('#totalClock').textContent='00:00:00'; $('#segClock').textContent='00:00'; $('#delta').textContent='';
  ui.render(); alert('Gespeichert!');
}

// ---------- Verlauf ----------
function renderHist(){
  const h = load('history', []);
  $('#history').innerHTML = h.length ? h.map(r=>{
    const runs = r.splits.filter((_,i)=>i%2===0), avg = runs.reduce((a,b)=>a+b,0)/runs.length;
    return `<div class="run"><b>${fmt(r.total,true)}</b> · ${r.division}<br>
      <small>${new Date(r.date).toLocaleDateString('de-DE')} · Ø Lauf ${fmt(avg)} /km</small></div>`;
  }).join('') : '<p class="hint">Noch keine Rennen gespeichert.</p>';
}
$('#clearHist').onclick = () => { if (confirm('Verlauf löschen?')){ localStorage.removeItem('history'); renderHist(); } };

renderPace(); renderStd(); ui.render(); ui.tick(); setInterval(ui.tick, 250);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
