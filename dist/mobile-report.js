import {detailLabel,fixture,reportName,fileName} from './presentation.js';
const W=1080,H=1920,P=66;
const mint='#9af2bf',navy='#202c3a',ink='#202b3a',muted='#71808b',paper='#f7f9fb';
function surface(){const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');if(!c)throw Error('No se ha podido crear el informe.');return{cv,c};}
function rect(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function text(c,t,x,y,size=38,color=ink,bold=false,max=W-P*2){let s=String(t);c.fillStyle=color;let f=size;do{c.font=`${bold?700:400} ${f}px system-ui,sans-serif`;if(c.measureText(s).width<=max||f<=24)break;f--;}while(true);while(c.measureText(s).width>max&&s.length>1)s=s.slice(0,-2)+'…';c.fillText(s,x,y);}
function lines(c,t,x,y,size=45,color=ink,max=W-P*2,lineHeight=size*1.3,maxLines=3){const words=String(t).split(/\s+/),rows=[];c.font=`700 ${size}px system-ui,sans-serif`;let row='';for(let i=0;i<words.length;i++){const next=row?row+' '+words[i]:words[i];if(row&&c.measureText(next).width>max){rows.push(row);row=words[i];if(rows.length===maxLines-1){row=words.slice(i).join(' ');break;}}else row=next;}if(row)rows.push(row);rows.forEach((line,i)=>text(c,line,x,y+i*lineHeight,size,color,true,max));return y+rows.length*lineHeight;}
function pageHeader(c,section,index,total){rect(c,0,0,W,H,paper);rect(c,0,0,W,10,'#e5ebe9');rect(c,0,0,W*(index/total),10,'#16865b');text(c,'01:',P,86,41,'#138257',true,88);text(c,section,P+112,84,32,muted,false,620);text(c,index+' / '+total,W-P-140,84,32,ink,true,140);}
function footer(c,label,demo){text(c,label,P,H-104,29,muted,false);text(c,'TimeControl · por rkoud'+(demo?' · Datos ficticios':''),P,H-54,28,'#138257');}
function track(c,m,row,i,x,y,width){const p=m.periods[i];text(c,(i+1)+'.ª parte',x,y,29,muted,false,width);rect(c,x,y+17,width,38,'#e4ece7',9);for(const v of row.intervals.filter(v=>v.period===i))rect(c,x+(v.start-p.start)/(p.end-p.start)*width,y+17,(v.end-v.start)/(p.end-p.start)*width,38,'#168e62',8);const s=Math.round(row.parts[i]/60)+' min';c.font='700 29px system-ui,sans-serif';const tw=c.measureText(s).width;rect(c,x+(width-tw)/2-10,y+20,tw+20,32,'#ffffffed',5);text(c,s,x+(width-tw)/2,y+46,29,'#205b40',true,width);}
export function mobileReportPages({match:m,teamName,rows,duration,demo=false}){
 const groupSize=m?5:6,total=2+Math.max(1,Math.ceil(rows.length/groupSize)),pages=[];
 let {cv,c}=surface();rect(c,0,0,W,H,navy);
 // Our own digital identity as a quiet watermark, inspired by the reference's cover hierarchy.
 c.save();c.globalAlpha=.045;text(c,'01:',5,1210,760,mint,true,1070);c.restore();
 text(c,'TimeControl',P,154,94,mint,true);text(c,'por rkoud',P,244,50,'#eef3f4');
 text(c,m?'INFORME DE PARTICIPACIÓN':'HISTORIAL DE JUGADORES',P,760,34,mint,true);
 if(m){const f=fixture(m,teamName);text(c,m.competition==='league'&&m.round?'Jornada '+m.round:m.competition==='friendly'?'Amistoso':'Tu partido',P,882,94,'#fff',true);lines(c,f.home,P,1014,64,'#fff',W-2*P,78,2);text(c,m.score?f.homeGoals+' – '+f.awayGoals:'vs',P,1182,105,mint,true);lines(c,f.away,P,1308,64,'#fff',W-2*P,78,2);text(c,m.date||'',P,1460,39,'#c7d2d8');rect(c,P,1510,W-2*P,2,'#4c5861');text(c,'Equipo',P,1582,31,'#a4b0b8');text(c,teamName||'Equipo',P,1643,46,'#fff',true);text(c,detailLabel(m),P,1724,32,'#c7d2d8');text(c,demo?'DATOS FICTICIOS DE DEMOSTRACIÓN':m.finished?'PARTIDO FINALIZADO':'INFORME PROVISIONAL',P,1830,27,mint,true);
 }else{lines(c,'Cada jugador. Cada minuto.',P,910,99,'#fff',W-P*2,125,3);text(c,'Total de minutos',P,1360,53,mint,true);text(c,'Partidos finalizados · Todos los equipos',P,1480,32,'#c7d2d8');text(c,demo?'DATOS FICTICIOS DE DEMOSTRACIÓN':'Historial de participación',P,1780,29,'#b9c9cf');}
 pages.push(cv);
 ({cv,c}=surface());pageHeader(c,'Resumen del partido',2,total);if(!m){text(c,'Resumen de jugadores',P,206,54,ink,true);}else text(c,'El partido, de un vistazo',P,206,54,ink,true);
 text(c,m?'Tiempo real de juego':'Minutos acumulados',P,340,34,muted);text(c,Math.round((m?duration:rows.reduce((s,r)=>s+r.total,0))/60)+' min',P,488,124,ink,true);
 const stats=m?[[rows.length,'Convocados'],[rows.filter(r=>r.total>0).length,'Con participación'],[rows.filter(r=>!r.total).length,'Sin participación']]:[[rows.length,'Jugadores'],[rows.reduce((s,r)=>s+r.appearances,0),'Convocatorias acumuladas']];
 stats.forEach(([val,label],i)=>{const y=625+i*172;rect(c,P,y,W-P*2,143,'#fff',18);text(c,label,P+28,y+54,32,muted,false,690);text(c,String(val),P+28,y+112,52,ink,true);});
 if(m){text(c,detailLabel(m),P,1240,32,'#138257',true);text(c,'Fútbol '+m.format+' · '+m.periods.length+(m.periods.length===1?' parte':' partes'),P,1310,34,ink,true);text(c,'El descanso no suma minutos.',P,1380,32,muted);text(c,'El total usa los segundos reales.',P,1440,32,muted);text(c,'Cada parte se redondea por separado.',P,1500,32,muted);}
 footer(c,'El orden coincide con el elegido en la aplicación.',demo);pages.push(cv);
 for(let start=0;start<rows.length||start===0;start+=groupSize){({cv,c}=surface());pageHeader(c,m?'Participación por jugador':'Minutos por jugador',pages.length+1,total);text(c,m?'Cuándo y cuánto jugó':'El recorrido de cada jugador',P,196,53,ink,true);text(c,m?'Tramos en verde · Descanso excluido':'Minutos calculados con los segundos reales',P,263,31,muted);
  rows.slice(start,start+groupSize).forEach((row,i)=>{const y=330+i*(m?267:233);rect(c,P,y,W-P*2,m?243:209,'#fff',19);text(c,(m?(row.number||'—')+'  ':'')+row.name,P+28,y+61,42,ink,true,650);const value=Math.round(row.total/60)+' min';text(c,value,W-P-260,y+61,39,'#138257',true,235);
   if(m){text(c,row.percent+'% del partido',P+28,y+115,31,muted);const gap=25,width=(W-2*P-56-gap*(m.periods.length-1))/m.periods.length;for(let pi=0;pi<m.periods.length;pi++)track(c,m,row,pi,P+28+pi*(width+gap),y+164,width);}else{text(c,row.teams,P+28,y+120,31,muted,false,W-2*P-56);text(c,row.appearances+' partidos finalizados',P+28,y+173,31,'#138257');}});
  if(!rows.length)text(c,'No hay jugadores en este filtro.',P,410,38,muted);
  footer(c,m?'Minutos por parte y total redondeados al más cercano.':'Todos los equipos · Según el filtro seleccionado.',demo);pages.push(cv);
 }
 return{pages,title:m?reportName(m,teamName):'TimeControl - Total de minutos',base:m?fileName(m,teamName):'TimeControl-total-de-minutos'};
}
const enc=new TextEncoder();
function concat(parts){const size=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
async function canvasBlob(canvas,type='image/png'){const b=await new Promise(resolve=>canvas.toBlob(resolve,type,.94));if(!b)throw Error('No se ha podido generar el archivo.');return b;}
export async function mobilePDF(report){
 const n=report.pages.length,objects=new Map(),refs=Array.from({length:n},(_,i)=>3+i*3);
 objects.set(1,enc.encode('<< /Type /Catalog /Pages 2 0 R >>'));objects.set(2,enc.encode(`<< /Type /Pages /Count ${n} /Kids [${refs.map(id=>id+' 0 R').join(' ')}] >>`));
 for(let i=0;i<n;i++){const id=refs[i],jpeg=new Uint8Array(await (await canvasBlob(report.pages[i],'image/jpeg')).arrayBuffer());objects.set(id,enc.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 306 544] /Resources << /XObject << /Im${i} ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`));objects.set(id+1,concat([enc.encode(`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),jpeg,enc.encode('\nendstream')]));const stream=`q\n306 0 0 544 0 0 cm\n/Im${i} Do\nQ\n`;objects.set(id+2,enc.encode(`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`));}
 const infoId=3+n*3,titleHex='FEFF'+Array.from({length:report.title.length},(_,i)=>report.title.charCodeAt(i).toString(16).padStart(4,'0')).join('');objects.set(infoId,enc.encode(`<< /Title <${titleHex}> /Author (rkoud) /Creator (TimeControl) >>`));
 const parts=[enc.encode('%PDF-1.4\n')],offsets=[0];let length=parts[0].length;
 for(let id=1;id<=infoId;id++){offsets[id]=length;const b=concat([enc.encode(id+' 0 obj\n'),objects.get(id),enc.encode('\nendobj\n')]);parts.push(b);length+=b.length;}
 const xref=length;parts.push(enc.encode(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`+offsets.slice(1).map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${offsets.length} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF`));return{blob:new Blob(parts,{type:'application/pdf'}),name:report.base+'.pdf'};
}
function crc32(bytes){let crc=-1;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^-1)>>>0;}
function bin(len){const b=new Uint8Array(len);return{b,v:new DataView(b.buffer)};}
export async function mobilePNGs(report){const locals=[],entries=[];let offset=0;
 for(let i=0;i<report.pages.length;i++){const name=enc.encode(report.base+'-'+String(i+1).padStart(2,'0')+'.png'),data=new Uint8Array(await (await canvasBlob(report.pages[i])).arrayBuffer()),crc=crc32(data),l=bin(30);l.v.setUint32(0,0x04034b50,true);l.v.setUint16(4,20,true);l.v.setUint16(6,0x800,true);l.v.setUint16(12,33,true);l.v.setUint32(14,crc,true);l.v.setUint32(18,data.length,true);l.v.setUint32(22,data.length,true);l.v.setUint16(26,name.length,true);locals.push(l.b,name,data);const e=bin(46);e.v.setUint32(0,0x02014b50,true);e.v.setUint16(4,20,true);e.v.setUint16(6,20,true);e.v.setUint16(8,0x800,true);e.v.setUint16(14,33,true);e.v.setUint32(16,crc,true);e.v.setUint32(20,data.length,true);e.v.setUint32(24,data.length,true);e.v.setUint16(28,name.length,true);e.v.setUint32(42,offset,true);entries.push(e.b,name);offset+=30+name.length+data.length;}
 const size=entries.reduce((s,e)=>s+e.length,0),end=bin(22);end.v.setUint32(0,0x06054b50,true);end.v.setUint16(8,report.pages.length,true);end.v.setUint16(10,report.pages.length,true);end.v.setUint32(12,size,true);end.v.setUint32(16,offset,true);return{blob:new Blob([...locals,...entries,end.b],{type:'application/zip'}),name:report.base+'-9x16.zip'};}
