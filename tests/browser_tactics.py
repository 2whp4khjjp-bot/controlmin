from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import os,shutil
OUT=Path(os.environ.get('CONTROLMIN_TEST_OUTPUT',str(Path(__file__).resolve().parents[1]/'test-results')));OUT.mkdir(exist_ok=True)
URL=os.environ.get('CONTROLMIN_TEST_URL','http://127.0.0.1:4173')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1050});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(12000)
 page.goto(URL);page.get_by_role('button',name='Explorar con datos ficticios').click()
 data=lambda:page.evaluate("JSON.parse(localStorage.getItem('controlmin.v1'))")
 m=data()['matches'][0];ids=m['starters'];bench={r['name']:r['id'] for r in m['roster']}
 def time(value):
  minute,second=value.split(':');page.locator('[data-clock="event-time"] .clock-min').fill(minute)
  expect(page.locator('[data-clock="event-time"] .clock-sec')).to_be_focused()
  page.locator('[data-clock="event-time"] .clock-sec').fill(second)
  expect(page.locator('.clock-colon').first).to_have_text(':')
 def at_clock(value):
  return page.evaluate('''async value=>{const {stateAt,parseTime}=await import('./engine.js');const db=JSON.parse(localStorage.getItem('controlmin.v1'));return stateAt(db.matches[0],0,parseTime(value));}''',value)
 page.get_by_role('button',name='Cambio de formación',exact=True).click()
 page.locator('#tactic-formation').fill('3-2-1');page.locator('#tactic-formation').press('Tab')
 time('05:00');expect(page.locator('#tactic-formation')).to_have_value('3-2-1')
 page.get_by_role('button',name='Confirmar formación',exact=True).click()
 assert at_clock('04:59')['formation']=='2-3-1';assert at_clock('05:00')['formation']=='3-2-1'
 assert page.locator('.formation-player').count()==7
 print('PASS: formación en el tiempo elegido',flush=True)
 page.get_by_role('button',name='Intercambiar posiciones',exact=True).click()
 page.locator('[data-action="tactic-slot"][data-slot="1"]').click();page.locator('[data-action="tactic-slot"][data-slot="2"]').click()
 time('06:00');expect(page.get_by_text('1 intercambios preparados',exact=True)).to_be_visible()
 page.get_by_role('button',name='Confirmar posiciones',exact=True).click()
 assert at_clock('06:00')['positions'][1]==ids[2] and at_clock('06:00')['positions'][2]==ids[1]
 print('PASS: intercambio por pulsación y reloj con avance automático',flush=True)
 page.get_by_role('button',name='Petición del árbitro',exact=True).click();time('07:00')
 page.locator(f'[data-action="select-player"][data-id="{ids[1]}"]').click()
 page.locator(f'[data-side="in"][data-id="{bench["Bruno V."]}"]').click()
 page.get_by_role('button',name='Confirmar cambio',exact=True).click()
 state=at_clock('07:30');assert state['positions'][2]==bench['Bruno V.'];assert ids[1] not in state['blocked']
 page.get_by_role('button',name='Cambio',exact=True).click();time('08:00')
 page.locator(f'[data-action="select-player"][data-id="{bench["Bruno V."]}"]').click()
 page.locator(f'[data-side="in"][data-id="{ids[1]}"]').click();page.get_by_role('button',name='Confirmar cambio',exact=True).click()
 assert at_clock('08:00')['positions'][2]==ids[1]
 assert data()['matches'][0]['events'][-2]['reason']=='referee'
 print('PASS: petición del árbitro y regreso al mismo puesto',flush=True)
 page.get_by_role('button',name='Editar evento 05:00',exact=True).click();time('05:10')
 page.get_by_role('button',name='Guardar corrección',exact=True).click()
 assert at_clock('05:05')['formation']=='2-3-1';assert at_clock('05:10')['formation']=='3-2-1'
 assert len([e for e in data()['matches'][0]['events'] if e['type']=='formation'])==1
 time('04:00');expect(page.locator('.formation-caption')).to_contain_text('1-2-3-1')
 time('09:00');expect(page.locator('.formation-caption')).to_contain_text('1-3-2-1')
 page.screenshot(path=str(OUT/'formacion-escritorio.png'),full_page=True)
 saved=data();page.reload();page.get_by_role('button',name='Continuar',exact=True).click();assert data()==saved
 page.locator('[data-clock="event-time"] .clock-min').fill('120');page.locator('[data-clock="event-time"] .clock-sec').fill('00')
 expect(page.locator('.clock-colon').first).to_have_text(':');time('09:00')
 page.get_by_role('button',name='Finalizar partido',exact=True).click();page.locator('#confirm-action').click()
 expect(page.locator('.tactical-report')).to_contain_text('Formación inicial')
 expect(page.locator('.tactical-report')).to_contain_text('Cambio de formación')
 expect(page.locator('.tactical-report')).to_contain_text('Petición del árbitro')
 expect(page.locator('.tactical-report')).to_contain_text('Cámara 05:10 · Juego 01:50')
 page.get_by_role('button',name='Exportar informe',exact=True).click()
 with page.expect_download() as dl:page.get_by_role('button',name='PDF móvil 9:16',exact=True).click()
 pdf=Path(dl.value.path()).read_bytes();assert pdf.count(b'/MediaBox [0 0 306 544]')==7
 (OUT/'informe-tactico-9x16.pdf').write_bytes(pdf)
 page.get_by_role('button',name='Cerrar',exact=True).click()
 page.locator('.nav[data-view="matches"]').click();page.get_by_role('button',name='Preparar partido',exact=True).click()
 page.locator('[name="format"]').select_option('11');expect(page.locator('[name="initialFormation"]')).to_have_value('4-3-3')
 page.locator('[name="initialFormation"]').fill('1-4-2-3-1');page.locator('[name="initialFormation"]').press('Tab')
 for cb in page.locator('[data-draft="starter"]').all()[:11]:cb.check()
 page.locator('[data-action="setup-slot"][data-slot="0"]').click();page.locator('[data-action="setup-slot"][data-slot="1"]').click()
 page.locator('[name="opponent"]').fill('Rival 11');page.locator('[name="round"]').fill('10')
 page.get_by_role('button',name='Comenzar análisis',exact=True).click()
 game=data()['matches'][-1];assert game['initialFormation']=='4-2-3-1';assert game['initialPositions'][0]==game['starters'][1]
 assert page.locator('.formation-player').count()==11
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'formacion-movil.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: edición, informe, permanencia, fútbol 11, portero y móvil',flush=True)
 b.close()
