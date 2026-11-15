import{formationLabel,formationSlots}from'./formations.js';
export function eventClock(m,e){const p=m.periods[e.period];const camera=e.time,elapsed=m.periods.slice(0,e.period).reduce((s,p)=>s+p.end-p.start,0)+e.time-p.start;const fmt=t=>Math.floor(t/60).toString().padStart(2,'0')+':'+(t%60).toString().padStart(2,'0');return `Cámara ${fmt(camera)} · Juego ${fmt(elapsed)} · ${e.period+1}.ª parte`;}
export function activityRows(m){
 const name=id=>m.roster.find(p=>p.id===id)?.name||'Jugador';
 const rows=[];
 if(m.initialFormation)rows.push({title:'Formación inicial · '+formationLabel(m.initialFormation),time:'Inicio del partido',text:formationSlots(m.format,m.initialFormation).map(slot=>slot.label+': '+(m.initialPositions?.[slot.index]?name(m.initialPositions[slot.index]):name(m.starters[slot.index]))).join(' · ')});
 for(const e of [...m.events].sort((a,b)=>a.period-b.period||a.time-b.time||(a.order??0)-(b.order??0)||a.id.localeCompare(b.id))){
  let title,text;
  if(e.type==='formation'){title='Cambio de formación · '+formationLabel(e.formation);text=formationSlots(m.format,e.formation).map(slot=>slot.label+': '+(e.positions[slot.index]?name(e.positions[slot.index]):'Vacante')).join(' · ');}
  if(e.type==='position'){title='Intercambio de posiciones';text=(e.swaps||[e.swap]).map(pair=>pair.map(name).join(' ↔ ')).join(' · ');}
  if(e.reason==='referee'){title='Cambio a petición del árbitro';text='Sale: '+e.out.map(name).join(', ')+'. Entra: '+e.in.map(name).join(', ')+'. Puede volver a entrar mediante otro cambio.';}
  if(title)rows.push({title,time:eventClock(m,e),text});
 }
 return rows;
}
