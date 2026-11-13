// Pure match engine. Seconds and immutable events are the source of truth.
export const uid=()=>globalThis.crypto.randomUUID();
export function parseTime(value){
 const s=String(value).trim();
 if(!/^\d{1,4}:[0-5]\d$/.test(s)) throw Error('Usa el formato minutos:segundos, por ejemplo 18:32.');
 const [m,sec]=s.split(':').map(Number);return m*60+sec;
}
export const clock=s=>`${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
export const mins=s=>Math.round(s/60);
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id);
export function validateMatch(m){
 if(!validId(m.id)||!validId(m.teamId)||typeof m.opponent!=='string'||!m.opponent.trim())throw Error('Introduce un rival.');
 if(![1,2].includes(m.periods.length))throw Error('El partido debe tener una o dos partes.');
 if(![7,11].includes(m.format))throw Error('Modalidad no válida.');
 let previous=-1;
 for(const p of m.periods){if(!Number.isInteger(p.start)||!Number.isInteger(p.end)||p.start<0||p.end<=p.start||p.start<previous)throw Error('Revisa los tiempos: cada fin debe ser posterior a su inicio y las partes no pueden solaparse.');previous=p.end;}
 if(new Set(m.roster.map(p=>p.id)).size!==m.roster.length)throw Error('Un jugador aparece repetido en la convocatoria.');
 if(!Array.isArray(m.events)||m.events.some(e=>!validId(e.id)))throw Error('Identificadores de eventos no válidos.');
 for(const p of m.roster)if(!validId(p.id)||typeof p.name!=='string'||!p.name.trim()||!['string','number'].includes(typeof p.number))throw Error('Jugador convocado no válido.');
 const ids=new Set(m.roster.map(p=>p.id));
 if(m.starters.length!==m.format||new Set(m.starters).size!==m.format||m.starters.some(id=>!ids.has(id)))throw Error(`Selecciona exactamente ${m.format} titulares convocados.`);
}
export function replay(m){
 validateMatch(m);
 const roster=new Set(m.roster.map(p=>p.id)), blocked=new Set(), intervals=[];
 let field=new Set(m.starters);const states=[];
 const events=[...m.events].sort((a,b)=>a.period-b.period||a.time-b.time||(a.order??0)-(b.order??0)||a.id.localeCompare(b.id));
 if(new Set(events.map(e=>e.id)).size!==events.length)throw Error('Hay eventos duplicados.');
 for(const e of events){if(!Number.isInteger(e.period)||!m.periods[e.period])throw Error('Parte de un evento no válida.');}
 for(let pi=0;pi<m.periods.length;pi++){
  const p=m.periods[pi],opened=new Map([...field].map(id=>[id,p.start]));
  const close=(id,t)=>{let start=opened.get(id);if(start!==undefined&&t>start)intervals.push({id,period:pi,start,end:t});opened.delete(id);field.delete(id);};
  for(const e of events.filter(e=>e.period===pi)){
   const prefix=`Evento ${clock(e.time)}: `;
   const fail=s=>{throw Error(prefix+s);};
   if(!Number.isInteger(e.time)||e.time<p.start||e.time>p.end)fail('el tiempo está fuera de la parte.');
   if(!['sub','red','injury'].includes(e.type))fail('tipo desconocido.');
   if(e.halftime&&(pi!==1||e.time!==p.start))fail('el cambio de descanso debe estar al inicio de la segunda parte.');
   if(!Array.isArray(e.out)||!Array.isArray(e.in)||!e.out.length)fail('selecciona quién sale.');
   const all=[...e.out,...e.in];if(new Set(all).size!==all.length||all.some(id=>!roster.has(id)))fail('selección de jugadores no válida.');
   if(e.type==='sub'&&e.out.length!==e.in.length)fail('debe entrar el mismo número de jugadores que sale.');
   if(e.type!=='sub'&&(e.out.length!==1||e.in.length))fail('la salida sin cambio es de un jugador.');
   for(const id of e.out)if(!field.has(id))fail(`${m.roster.find(p=>p.id===id).name} no estaba en el campo.`);
   for(const id of e.in){if(field.has(id))fail('un jugador que entra ya estaba en el campo.');if(blocked.has(id))fail('un jugador expulsado o lesionado sin cambio no puede regresar.');}
   for(const id of e.out){close(id,e.time);if(e.type!=='sub')blocked.add(id);}
   for(const id of e.in){field.add(id);opened.set(id,e.time);}
  }
  states.push({field:[...field],blocked:[...blocked]});
  for(const [id,start]of opened)if(p.end>start)intervals.push({id,period:pi,start,end:p.end});
 }
 const duration=m.periods.reduce((s,p)=>s+p.end-p.start,0);
 const rows=m.roster.map(player=>{
  const parts=m.periods.map((p,pi)=>intervals.filter(iv=>iv.id===player.id&&iv.period===pi).reduce((s,iv)=>s+iv.end-iv.start,0));
  const total=parts.reduce((a,b)=>a+b,0);return{...player,parts,total,percent:duration?Math.round(total/duration*100):0,intervals:intervals.filter(iv=>iv.id===player.id)};
 });
 return{rows,intervals,duration,states,events};
}
export function stateAt(m,period,time,excludeId){
 const copy=structuredClone(m), editing=m.events.find(e=>e.id===excludeId);copy.events=copy.events.filter(e=>e.id!==excludeId&&(e.period<period||(e.period===period&&(e.time<time||(e.time===time&&(!editing||(e.order??0)<(editing.order??0)))))));
 const r=replay(copy);return r.states[period];
}
export function validateDB(db){
 if(!db||db.version!==1||!Array.isArray(db.players)||!Array.isArray(db.teams)||!Array.isArray(db.matches))throw Error('La copia no tiene un formato ControlMin válido.');
 for(const list of [db.players,db.teams,db.matches])if(new Set(list.map(v=>v.id)).size!==list.length)throw Error('La copia contiene identificadores duplicados.');
 const pids=new Set(db.players.map(p=>p.id)),tids=new Set(db.teams.map(t=>t.id));
 for(const p of db.players)if(!validId(p.id)||typeof p.name!=='string'||!p.name.trim())throw Error('Ficha de jugador no válida.');
 for(const t of db.teams){if(!validId(t.id)||typeof t.name!=='string'||!t.name.trim()||!Array.isArray(t.members)||![7,11].includes(t.format)||new Set(t.members.map(m=>m.playerId)).size!==t.members.length)throw Error('Equipo no válido.');for(const m of t.members)if(!pids.has(m.playerId))throw Error('El equipo contiene un jugador sin ficha.');}
 for(const m of db.matches){if(!tids.has(m.teamId)||m.roster.some(p=>!pids.has(p.id)))throw Error('El partido referencia datos que faltan.');replay(m);}
 return db;
}
export function backup(db,scope,id){
 let result=structuredClone(db);
 if(scope==='team'){result.teams=result.teams.filter(t=>t.id===id);result.matches=result.matches.filter(m=>m.teamId===id);}
 if(scope==='match'){result.matches=result.matches.filter(m=>m.id===id);result.teams=result.teams.filter(t=>result.matches.some(m=>m.teamId===t.id));result.teams.forEach(t=>t.members=t.members.filter(p=>result.matches.some(m=>m.roster.some(r=>r.id===p.playerId))));}
 if(scope!=='all'){const used=new Set([...result.teams.flatMap(t=>t.members.map(p=>p.playerId)),...result.matches.flatMap(m=>m.roster.map(p=>p.id))]);result.players=result.players.filter(p=>used.has(p.id));}
 return{app:'ControlMin',version:1,scope,id:id||null,exportedAt:new Date().toISOString(),data:result};
}
export function importBackup(current,packet){
 if(packet.app!=='ControlMin'||packet.version!==1||!['all','team','match'].includes(packet.scope))throw Error('No es una copia compatible de ControlMin.');
 const incoming=validateDB(packet.data);
 if(packet.scope==='all')return structuredClone(incoming);
 if(!packet.id)throw Error('La copia no identifica el ámbito.');
 if(packet.scope==='team'&&(incoming.teams.length!==1||incoming.teams[0].id!==packet.id||incoming.matches.some(m=>m.teamId!==packet.id)))throw Error('Ámbito de equipo incoherente.');
 if(packet.scope==='match'&&(incoming.matches.length!==1||incoming.matches[0].id!==packet.id||incoming.teams.length!==1||incoming.teams[0].id!==incoming.matches[0].teamId))throw Error('Ámbito de partido incoherente.');
 let next=structuredClone(current);
 for(const p of incoming.players){const i=next.players.findIndex(x=>x.id===p.id);if(i<0)next.players.push(p);else next.players[i]=p;}
 if(packet.scope==='team'){
  next.teams=next.teams.filter(t=>t.id!==packet.id).concat(incoming.teams);
  next.matches=next.matches.filter(m=>m.teamId!==packet.id).concat(incoming.matches);
 }else{
  for(const t of incoming.teams)if(!next.teams.some(x=>x.id===t.id))next.teams.push(t);
  next.matches=next.matches.filter(m=>m.id!==packet.id).concat(incoming.matches);
 }
 return validateDB(next);
}
