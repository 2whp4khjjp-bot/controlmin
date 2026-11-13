from playwright.sync_api import sync_playwright,expect
import json,os,shutil
from pathlib import Path
OUT=Path(os.environ.get("CONTROLMIN_TEST_OUTPUT",str(Path(__file__).resolve().parents[1]/"test-results")))
OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('CONTROLMIN_TEST_URL','http://127.0.0.1:4173')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path,args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':1440,'height':1050})
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.get_by_role('button',name='Explorar con datos ficticios').click()
 expect(page.locator('h1')).to_have_text('Análisis del partido')
 data=lambda:page.evaluate("JSON.parse(localStorage.getItem('controlmin.v1'))")
 original=data();mid=original['matches'][0]['id']
 # Reload does not reset starter intervals or events.
 page.reload();page.get_by_role('button',name='Continuar').click()
 assert data()['matches']==original['matches']
 # Edit an earlier change (independent of later events).
 page.get_by_role('button',name='Editar evento 13:20',exact=True).click()
 page.locator('#event-time').fill('14:10');page.locator('#event-time').press('Tab')
 # Change time reset selections; reselect the event players.
 page.locator('[data-side="out"]').filter(has_text='Dani L.').click()
 page.locator('[data-side="in"]').filter(has_text='Álex C.').click()
 page.get_by_role('button',name='Guardar corrección').click()
 assert any(e['time']==850 for e in data()['matches'][0]['events'])
 # Reload exact updated records.
 saved=data();page.reload();assert data()==saved
 page.get_by_role('button',name='Continuar').click()
 # Expulsion and injury after all historical events, each without replacement.
 page.locator('#event-time').fill('62:00');page.locator('#event-time').press('Tab')
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
 expect(page.locator('h1')).to_have_text('Informe del partido')
 page.screenshot(path=str(OUT/'report.png'),full_page=True)
 page.pdf(path=str(OUT/'informe-generado.pdf'),landscape=True,format='A4',print_background=True)
 assert data()['matches'][0]['finished'] is True
 # Identity across teams and accumulated stats.
 page.locator('.nav[data-view="players"]').click();page.get_by_role('button',name='Ver ficha').first.click()
 expect(page.locator('h1')).to_have_text('Hugo M.')
 expect(page.locator('#profile-team')).to_have_value('')
 # Export all, import same scope and no duplicates.
 page.locator('.nav[data-view="settings"]').click();page.get_by_role('button',name='Exportar copia',exact=True).click()
 with page.expect_download() as dl:page.get_by_role('button',name='Descargar JSON',exact=True).click()
 f=dl.value.path();packet=json.load(open(f));assert len(packet['data']['teams'])==2
 page.get_by_role('button',name='Cerrar',exact=True).click()
 page.locator('#import-file').set_input_files(f)
 expect(page.locator('dialog')).to_be_visible();page.locator('#confirm-action').click()
 assert len(data()['teams'])==2 and len(data()['players'])==12 and len(data()['matches'])==1
 # Existing player links to another team without duplicate identity.
 page.locator('#team-select').select_option(data()['teams'][1]['id'])
 page.locator('.nav[data-view="roster"]').click();page.get_by_role('button',name='Añadir jugador',exact=True).click()
 page.locator('#existing-player').select_option(data()['players'][11]['id'])
 page.get_by_role('button',name='Guardar',exact=True).click()
 assert len(data()['players'])==12 and len(data()['teams'][1]['members'])==10
 # Prepare a one-half tournament with exactly seven starters.
 page.get_by_role('button',name='Preparar partido',exact=True).click()
 page.locator('[name="opponent"]').fill('Rival torneo')
 page.locator('[name="periodCount"]').select_option('1')
 for checkbox in page.locator('[data-draft="starter"]').all()[:7]:checkbox.check()
 page.locator('[name="end0"]').fill('20:30')
 page.get_by_role('button',name='Comenzar análisis',exact=True).click()
 expect(page.locator('h1')).to_have_text('Análisis del partido')
 assert len(data()['matches'][-1]['periods'])==1
 # Simultaneous replacements and return.
 page.locator('#event-time').fill('05:30');page.locator('#event-time').press('Tab')
 ids=[x['id'] for x in data()['matches'][-1]['roster']]
 for pid in ids[:2]:page.locator(f'[data-side="out"][data-id="{pid}"]').click()
 for pid in ids[7:9]:page.locator(f'[data-side="in"][data-id="{pid}"]').click()
 page.get_by_role('button',name='Confirmar cambio',exact=True).click()
 assert len(data()['matches'][-1]['events'][0]['out'])==2
 page.locator('#event-time').fill('10:00');page.locator('#event-time').press('Tab')
 page.locator(f'[data-side="out"][data-id="{ids[7]}"]').click()
 page.locator(f'[data-side="in"][data-id="{ids[0]}"]').click()
 page.get_by_role('button',name='Confirmar cambio',exact=True).click()
 assert len(data()['matches'][-1]['events'])==2
 # Mobile navigation and roster: no document-wide overflow.
 page.set_viewport_size({'width':390,'height':844});page.locator('.nav[data-view="roster"]').click()
 page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 assert not errors,errors
 print('PASS: reload, correction, red card, injury, report PDF, identity, export/import, tournament, multi-change, reentry, mobile; no JS errors.')
 browser.close()
