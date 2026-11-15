import subprocess,sys,time,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
server=subprocess.Popen([sys.executable,'-m','http.server','4173','--directory',str(root/'dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(30):
  try:urllib.request.urlopen('http://127.0.0.1:4173',timeout=2);break
  except OSError:time.sleep(.2)
 else:raise SystemExit('No se pudo iniciar el servidor de prueba')
 for suite in ['browser_smoke.py','browser_tactics.py']:
  subprocess.run([sys.executable,'-u',str(root/'tests'/suite)],check=True,cwd=root,timeout=150)
finally:server.terminate();server.wait(timeout=10)
