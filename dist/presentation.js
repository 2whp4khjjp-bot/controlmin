export function validateDetails(m){
 if(m.competition!==undefined&&!['league','friendly'].includes(m.competition))throw Error('Selecciona Liga o Amistoso.');
 if(m.round!=null&&(!Number.isInteger(m.round)||m.round<1||m.round>999))throw Error('La jornada debe ser un entero entre 1 y 999.');
 if(m.venue!==undefined&&!['home','away'].includes(m.venue))throw Error('Selecciona Casa o Fuera.');
 if(m.score!=null&&(!Number.isInteger(m.score.for)||!Number.isInteger(m.score.against)||m.score.for<0||m.score.against<0||m.score.for>99||m.score.against>99))throw Error('Introduce los dos goles del resultado, entre 0 y 99.');
}
export function detailLabel(m){return[(m.competition==='league'?'Liga'+(m.round?' · Jornada '+m.round:''):m.competition==='friendly'?'Amistoso':'Tipo sin indicar'),m.venue==='home'?'En casa':m.venue==='away'?'Fuera de casa':'Ubicación sin indicar'].join(' · ');}
export function fixture(m,teamName){const own=teamName||'Equipo',other=m.opponent;return m.venue==='away'?{home:other,away:own,homeGoals:m.score?.against,awayGoals:m.score?.for}:{home:own,away:other,homeGoals:m.score?.for,awayGoals:m.score?.against};}
export function reportName(m,teamName){const f=fixture(m,teamName);const prefix=m.competition==='league'?(m.round?String(m.round).padStart(2,'0')+' - Jornada '+m.round+' - Liga':'Liga - Sin jornada'):m.competition==='friendly'?'Amistoso':'Partido';return`${prefix} - ${f.home}${m.score?' '+f.homeGoals+'-'+f.awayGoals+' ':' vs '}${f.away} - ${m.date||''}`;}
export function fileName(m,teamName){return reportName(m,teamName).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').replace(/-+/g,'-').replace(/-$/,'');}
export function sortRows(rows,sort={key:'number',direction:'asc'}){
 const keys=['number','name','part0','part1','total','percent','teams','appearances'];const key=keys.includes(sort?.key)?sort.key:'number',dir=sort?.direction==='desc'?-1:1;
 const value=r=>key==='part0'?(r.parts?.[0]||0):key==='part1'?(r.parts?.[1]||0):r[key]??'';
 const cmp=(a,b)=>typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b),'es',{numeric:true,sensitivity:'base'});
 return rows.slice().sort((a,b)=>dir*cmp(value(a),value(b))||cmp(a.name,b.name)||String(a.id).localeCompare(String(b.id)));
}
