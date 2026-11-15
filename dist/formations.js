export const formationPresets={7:['2-3-1','3-2-1','2-2-2','3-1-2','1-3-2','1-2-3'],11:['4-3-3','4-4-2','4-2-3-1','3-5-2','3-4-3','5-3-2','4-1-4-1']};
export function normalizeFormation(format,value){
 let parts=String(value??'').trim().split(/[-–—\s]+/).map(Number);
 if(parts[0]===1&&parts.reduce((a,b)=>a+b,0)===format)parts=parts.slice(1);
 if(![7,11].includes(format)||parts.length<2||parts.length>5||parts.some(n=>!Number.isInteger(n)||n<1||n>5)||parts.reduce((a,b)=>a+b,0)!==format-1)throw Error(`La formación debe sumar ${format-1} jugadores de campo, además del portero. Ejemplo: ${format===7?'1-2-3-1':'1-4-3-3'}.`);
 return parts.join('-');
}
export const defaultFormation=format=>formationPresets[format]?.[0]||'2-3-1';
export const formationLabel=value=>value?'1-'+value:'Sin formación registrada';
export function formationSlots(format,value){const rows=normalizeFormation(format,value).split('-').map(Number),slots=[{index:0,x:50,y:90,label:'Portero'}];let index=1;rows.forEach((count,line)=>{for(let j=0;j<count;j++)slots.push({index:index++,x:((j+1)/(count+1))*100,y:72-line*(58/Math.max(1,rows.length-1)),label:(line===0?'Defensa':line===rows.length-1?'Ataque':'Medio')+' '+(j+1)});});return slots;}
export function fitPositions(positions,players,size){const ids=new Set(players),seen=new Set(),result=Array.from({length:size},(_,i)=>{const id=positions?.[i];if(ids.has(id)&&!seen.has(id)){seen.add(id);return id;}return null;});for(const id of players)if(!seen.has(id)){const at=result.indexOf(null);if(at>=0){result[at]=id;seen.add(id);}}return result;}
export function validatePositions(positions,field,format){if(!Array.isArray(positions)||positions.length!==format)throw Error('La distribución debe tener una casilla por puesto, incluido el portero.');const ids=positions.filter(v=>v!==null);if(ids.length!==field.size||new Set(ids).size!==ids.length||ids.some(id=>!field.has(id)))throw Error('Distribuye una sola vez a cada jugador que está en el campo.');}
