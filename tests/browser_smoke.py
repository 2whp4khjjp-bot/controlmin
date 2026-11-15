from playwright.sync_api import sync_playwright,expect
import json,os,shutil
from pathlib import Path
OUT=Path(os.environ.get("CONTROLMIN_TEST_OUTPUT",str(Path(__file__).resolve().parents[1]/"test-results")))
OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('CONTROLMIN_TEST_URL','http://127.0.0.1:4173')
def set_time(page,ident,value):
 minutes,seconds=value.split(':')
 page.locator(f'[data-clock="{ident}"] .clock-min').fill(minutes)
 page.locator(f'[data-clock="{ident}"] .clock-sec').fill(seconds)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path,args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':1440,'height':1050})
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.get_by_role('button',name='Explorar con datos ficticios').click()
 expect(page.locator('h1')).to_have_text('Análisis del partido')
 expect(page).to_have_title('TimeControl · por rkoud')
 data=lambda:page.evaluate("JSON.parse(localStorage.getItem('controlmin.v1'))")
 original=data();mid=original['matches'][0]['id']
 # Reload does not reset starter intervals or events.
 page.reload();page.get_by_role('button',name='Continuar').click()
 assert data()['matches']==original['matches']
 # Edit an earlier change (independent of later events).
 page.get_by_role('button',name='Editar evento 13:20',exact=True).click()
 set_time(page,'event-time','14:10')
 # Change time reset selections; reselect the event players.
 page.locator('[data-side="out"]').filter(has_text='Dani L.').click()
 page.locator('[data-side="in"]').filter(has_text='Álex C.').click()
 page.get_by_role('button',name='Guardar corrección').click()
 assert any(e['time']==850 for e in data()['matches'][0]['events'])
 # Reload exact updated records.
 saved=data();page.reload();assert data()==saved
 page.get_by_role('button',name='Continuar').click()
 # Expulsion and injury after all historical events, each without replacement.
 set_time(page,'event-time','62:00')
 page.get_by_role('button',name='Expulsión',exact=True).click()
 page.locator('[data-side="out"]').filter(has_text='Hugo M.').click()
 page.get_by_role('button',name='Confirmar salida').click()
 assert data()['matches'][0]['events'][-1]['type']=='red'
 page.get_by_role('button',name='Lesión sin cambio',exact=True).click()
 page.locator('[data-side="out"]').filter(has_text='Leo S.').click()
 page.get_by_role('button',name='Confirmar salida').click()
 assert data()['matches'][0]['events'][-1]['type']=='injury'
 # Final report + print PDF.
 page.get_by_role('button',name='Finalizar partido',exact=True).click()
 page.locator('#confirm-action').click()
 expect(page.locator('h1')).to_contain_text('08 - Jornada 8 - Liga')
 page.screenshot(path=str(OUT/'report.png'),full_page=True)
 page.pdf(path=str(OUT/'informe-generado.pdf'),prefer_css_page_size=True,print_background=True)
 assert data()['matches'][0]['finished'] is True
 # Metadata edits are allowed after finalizing and reflect home/away score order.
 page.get_by_role('button',name='Volver al partido',exact=True).click()
 expect(page.locator('.pitch')).to_be_visible()
 page.screenshot(path=str(OUT/'campo.png'),full_page=True)
 page.get_by_role('button',name='Datos del partido',exact=True).click()
 page.locator('dialog [name="round"]').fill('12')
 page.locator('dialog [name="venue"]').select_option('away')
 page.locator('dialog [name="goalsFor"]').fill('3')
 page.locator('dialog [name="goalsAgainst"]').fill('1')
 page.get_by_role('button',name='Guardar',exact=True).click()
 page.get_by_role('button',name='Informe',exact=True).click()
 expect(page.locator('h1')).to_contain_text('12 - Jornada 12 - Liga - UD Central 1-3 CD Norte')
 # Descending sort is used by CSV, printable player cards and persisted after reload.
 page.locator('[data-action="sort-report"][data-key="total"]').click()
 page.locator('[data-action="sort-report"][data-key="total"]').click()
 first=page.locator('.screen-table tbody tr').first.locator('.person').inner_text()
 assert page.locator('.print-player').first.inner_text().find(first)>=0
 page.get_by_role('button',name='Exportar informe',exact=True).click()
 with page.expect_download() as dl:page.get_by_role('button',name='CSV para Excel',exact=True).click()
 assert dl.value.suggested_filename.startswith('12-')
 import csv
 csvrows=list(csv.reader(open(dl.value.path(),encoding='utf-8-sig'),delimiter=';'))
 assert csvrows[1][1]==first
 assert [csvrows[1][csvrows[0].index(key)] for key in ['Competicion','Jornada','Ubicacion','Goles_equipo','Goles_rival']]==['Liga','12','Fuera','3','1']
 # Mobile PDF: every page is exactly 9:16, with a cover, summary and paginated players.
 with page.expect_download() as pdf_dl:page.get_by_role('button',name='PDF móvil 9:16',exact=True).click()
 pdfdata=Path(pdf_dl.value.path()).read_bytes();assert pdf_dl.value.suggested_filename.startswith('12-')
 assert pdfdata.startswith(b'%PDF-1.4') and pdfdata.count(b'/MediaBox [0 0 306 544]')==6
 (OUT/'12-informe-movil-9x16.pdf').write_bytes(pdfdata)
 # PNG pages use the same 9:16 layout and are packaged as a valid ZIP.
 with page.expect_download() as zip_dl:page.get_by_role('button',name='Imágenes 9:16 (ZIP)',exact=True).click()
 import zipfile,struct
 with zipfile.ZipFile(zip_dl.value.path()) as z:
  assert z.testzip() is None and len(z.namelist())==6
  for name in z.namelist():
   raw=z.read(name);assert struct.unpack('>II',raw[16:24])==(1080,1920)
  (OUT/'portada-9x16.png').write_bytes(z.read(z.namelist()[0]))
  (OUT/'jugadores-9x16.png').write_bytes(z.read(z.namelist()[2]))
 (OUT/'12-informe-9x16.zip').write_bytes(Path(zip_dl.value.path()).read_bytes())

 with page.expect_download() as image_dl:page.get_by_role('button',name='Imagen continua (PNG)',exact=True).click()
 assert image_dl.value.suggested_filename.startswith('12-')
 import struct
 png=Path(image_dl.value.path()).read_bytes();width,height=struct.unpack('>II',png[16:24]);assert width==1080 and height>width
 (OUT/'12-informe-movil.png').write_bytes(png)
 # Check that the browser print action supplies a journey-prefixed PDF title.
 page.evaluate('window.print=()=>{window.__printTitle=document.title}')
 page.get_by_role('button',name='Imprimir en A4 vertical',exact=True).click()
 assert page.evaluate('window.__printTitle').startswith('12 - Jornada 12')
 page.pdf(path=str(OUT/'12-informe-vertical.pdf'),prefer_css_page_size=True,print_background=True)
 page.emulate_media(media='print')
 assert page.locator('.screen-table').is_hidden() and page.locator('.print-roster').is_visible()
 page.screenshot(path=str(OUT/'impresion-vertical.png'),full_page=True)
 page.emulate_media(media='screen')
 assert data()['matches'][0]['reportSort']=={'key':'total','direction':'desc'}
 # Identity across teams and accumulated stats.
 page.locator('.nav[data-view="players"]').click();page.locator('tbody tr').filter(has_text='Hugo M.').get_by_role('button',name='Ver ficha').click()
 expect(page.locator('h1')).to_have_text('Hugo M.')
 expect(page.locator('#profile-team')).to_have_value('')
 # Aggregate column sorting and CSV use the same order.
 page.locator('.nav[data-view="players"]').click()
 page.locator('[data-action="sort-players"][data-key="total"]').click()
 page.locator('[data-action="sort-players"][data-key="total"]').click()
 first=page.locator('.totals-table tbody tr').first.locator('.namecell strong').inner_text()
 with page.expect_download() as dl:page.get_by_role('button',name='CSV',exact=True).click()
 csvrows=list(csv.reader(open(dl.value.path(),encoding='utf-8-sig'),delimiter=';'))
 assert csvrows[1][0]==first
 # Export all, import same scope and no duplicates.
 page.locator('.nav[data-view="settings"]').click();page.get_by_role('button',name='Exportar copia',exact=True).click()
 with page.expect_download() as dl:page.get_by_role('button',name='Descargar JSON',exact=True).click()
 f=dl.value.path();packet=json.load(open(f));assert packet['app']=='TimeControl';assert len(packet['data']['teams'])==2
 page.get_by_role('button',name='Cerrar',exact=True).click()
 page.locator('#import-file').set_input_files(f)
 expect(page.locator('dialog')).to_be_visible();page.locator('#confirm-action').click()
 assert len(data()['teams'])==2 and len(data()['players'])==12 and len(data()['matches'])==1
 # Legacy match files remain readable with unknown metadata (no invented results).
 legacy=json.loads(json.dumps(packet))
 for match in legacy['data']['matches']:
  for key in ['competition','round','venue','score','initialFormation','initialPositions']:match.pop(key,None)
 legacy['app']='ControlMin'
 legacy_file=OUT/'legacy.json';legacy_file.write_text(json.dumps(legacy))
 page.locator('#import-file').set_input_files(str(legacy_file))
 page.locator('#confirm-action').click()
 page.get_by_role('button',name='Revisar',exact=True).click()
 expect(page.locator('.heading')).to_contain_text('Tipo sin indicar')
 expect(page.locator('.heading')).to_contain_text('Ubicación sin indicar')

 # Existing player links to another team without duplicate identity.
 page.locator('#team-select').select_option(data()['teams'][1]['id'])
 page.locator('.nav[data-view="roster"]').click();page.get_by_role('button',name='Añadir jugador',exact=True).click()
 page.locator('#existing-player').select_option(data()['players'][11]['id'])
 page.get_by_role('button',name='Guardar',exact=True).click()
 assert len(data()['players'])==12 and len(data()['teams'][1]['members'])==10
 # Prepare a one-half tournament with exactly seven starters.
 page.get_by_role('button',name='Preparar partido',exact=True).click()
 page.locator('[name="opponent"]').fill('Rival torneo')
 page.locator('[name="round"]').fill('9')
 page.locator('[name="periodCount"]').select_option('1')
 for checkbox in page.locator('[data-draft="starter"]').all()[:7]:checkbox.check()
 set_time(page,'setup-end-0','20:30')
 page.get_by_role('button',name='Comenzar análisis',exact=True).click()
 expect(page.locator('h1')).to_have_text('Análisis del partido')
 assert len(data()['matches'][-1]['periods'])==1
 # Simultaneous replacements and return.
 set_time(page,'event-time','05:30')
 ids=[x['id'] for x in data()['matches'][-1]['roster']]
 for pid in ids[:2]:page.locator(f'[data-side="out"][data-id="{pid}"]').click()
 for pid in ids[7:9]:page.locator(f'[data-side="in"][data-id="{pid}"]').click()
 page.get_by_role('button',name='Confirmar cambio',exact=True).click()
 assert len(data()['matches'][-1]['events'][0]['out'])==2
 set_time(page,'event-time','10:00')
 page.locator(f'[data-side="out"][data-id="{ids[7]}"]').click()
 page.locator(f'[data-side="in"][data-id="{ids[0]}"]').click()
 page.get_by_role('button',name='Confirmar cambio',exact=True).click()
 assert len(data()['matches'][-1]['events'])==2
 # Mobile navigation and roster: no document-wide overflow.
 page.set_viewport_size({'width':390,'height':844});page.locator('.nav[data-view="roster"]').click()
 page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 # Friendly matches have no league round; a goalless draw is a recorded result.
 page.locator('.nav[data-view="matches"]').click()
 page.get_by_role('button',name='Preparar partido',exact=True).click()
 page.locator('[name="opponent"]').fill('Amistoso de prueba')
 page.locator('[name="competition"]').select_option('friendly')
 assert page.locator('[name="round"]').count()==0
 page.locator('[name="venue"]').select_option('away')
 page.locator('[name="goalsFor"]').fill('0');page.locator('[name="goalsAgainst"]').fill('0')
 for checkbox in page.locator('[data-draft="starter"]').all()[:7]:checkbox.check()
 page.get_by_role('button',name='Comenzar análisis',exact=True).click()
 expect(page.locator('.heading')).to_contain_text('Amistoso')
 assert data()['matches'][-1]['round'] is None
 assert data()['matches'][-1]['score']=={'for':0,'against':0}
 assert data()['matches'][-1]['venue']=='away'
 assert not errors,errors
 print('PASS: reload, correction, red card, injury, report PDF, identity, export/import, tournament, multi-change, reentry, mobile; no JS errors.')
 browser.close()
