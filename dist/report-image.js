import{activityRows}from'./event-report.js';
// A single tall, high-resolution report for opening and sharing on a phone.
import {detailLabel,fixture,reportName,fileName} from './presentation.js';
export async function reportImage({match,teamName,rows,duration,demo=false}){
 const activities=match?activityRows(match):[];const canvas=document.createElement('canvas'),w=1080,pad=52,header=match?350:235,rowHeight=match?134:112;
 canvas.width=w;canvas.height=header+rows.length*rowHeight+145+activities.length*250;const c=canvas.getContext('2d');
 if(!c)throw Error('Tu navegador no permite generar la imagen. Puedes usar el PDF vertical.');
 const box=(x,y,width,height,color,r=12)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,width,height,r);c.fill();};
 const text=(s,x,y,size=26,color='#23392e',bold=false,max=w-2*pad)=>{c.fillStyle=color;let n=size;do{c.font=`${bold?'600':'400'} ${n}px system-ui, sans-serif`;if(c.measureText(s).width<=max||n<=15)break;n--;}while(true);while(c.measureText(s).width>max&&s.length>1)s=s.slice(0,-2)+'…';c.fillText(s,x,y);};
 box(0,0,w,canvas.height,'#f4f7f4',0);box(0,0,w,header-32,'#10283e',0);
 text('TimeControl · por rkoud',pad,65,30,'#a5efc7',true);
 if(demo)text('EJEMPLO FICTICIO',w-320,65,19,'#bcd4c8',false,280);
 if(match){
  const f=fixture(match,teamName);text(match.competition==='league'&&match.round?String(match.round).padStart(2,'0')+' · JORNADA '+match.round+' · LIGA':match.competition==='friendly'?'AMISTOSO':'INFORME DEL PARTIDO',pad,126,25,'#dbeee4',true);
  text(f.home+(match.score?' '+f.homeGoals+' – '+f.awayGoals+' ':' vs ')+f.away,pad,186,38,'#ffffff',true);
  text(detailLabel(match)+' · '+(match.date||''),pad,233,23,'#bdd3cb');
  text(Math.round(duration/60)+' min de juego · Fútbol '+match.format+' · '+rows.length+' convocados',pad,275,23,'#bdd3cb');
 }else{text('Total de minutos',pad,130,40,'#fff',true);text('Partidos finalizados · Todos los equipos',pad,176,24,'#bdd3cb');}
 rows.forEach((row,index)=>{
  const y=header+index*rowHeight;box(pad,y,w-2*pad,rowHeight-12,'#ffffff');
  const name=(match?(row.number||'—')+'  ':'')+row.name;
  text(name,pad+22,y+36,27,'#23392e',true,655);
  const total=Math.round(row.total/60)+' min'+(match?' · '+row.percent+'%':'');
  c.font='600 25px system-ui, sans-serif';text(total,w-pad-22-c.measureText(total).width,y+36,25,'#087f56',true,280);
  if(match){
   const gap=22,count=match.periods.length,trackWidth=(w-2*pad-44-gap*(count-1))/count;
   match.periods.forEach((p,i)=>{
    const x=pad+22+i*(trackWidth+gap),by=y+77;
    text((i+1)+'.ª parte',x,y+62,18,'#718477');box(x,by,trackWidth,27,'#e9efea',5);
    for(const iv of row.intervals.filter(v=>v.period===i))box(x+(iv.start-p.start)/(p.end-p.start)*trackWidth,by,(iv.end-iv.start)/(p.end-p.start)*trackWidth,27,'#159566',5);
    const label=Math.round(row.parts[i]/60)+' min';c.font='600 18px system-ui, sans-serif';const tw=c.measureText(label).width;
    box(x+(trackWidth-tw)/2-8,by+2,tw+16,23,'#ffffffed',4);text(label,x+(trackWidth-tw)/2,by+20,18,'#225d42',true);
   });
  }else{text(row.teams,pad+22,y+69,21,'#708477',false,900);text(row.appearances+' partidos',pad+22,y+92,18,'#708477');}
 });
 const fy=header+rows.length*rowHeight;
 text(match?'Tramos jugados en verde. Descanso excluido.':'Minutos calculados con los segundos reales.',pad,fy+35,21,'#688073');
 text(match?'Partes y total redondeados de forma independiente.':'El orden coincide con el panel y su filtro de búsqueda.',pad,fy+70,20,'#688073');
 text('rkoud.com · '+(demo?'Datos ficticios de demostración':match&&!match.finished?'Informe provisional':'TimeControl'),pad,fy+111,20,'#087f56',true);
 activities.forEach((e,i)=>{const y=fy+155+i*250;box(pad,y,w-2*pad,230,'#fff');text(e.title,pad+22,y+38,27,'#23392e',true,920);text(e.time,pad+22,y+80,23,'#087f56',false,920);const chunks=e.text.match(/.{1,75}(?:\s|$)|.{1,75}/g)||[];chunks.slice(0,3).forEach((line,j)=>text(line.trim(),pad+22,y+124+j*34,22,'#687d70',false,920));});
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob)throw Error('No se pudo generar la imagen. Prueba con PDF.');
 return{blob,name:match?fileName(match,teamName)+'.png':'TimeControl-total-de-minutos.png',title:match?reportName(match,teamName):'Total de minutos'};
}
