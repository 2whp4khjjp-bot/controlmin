# ControlMin · por rkoud

[![Pruebas y publicación](https://github.com/2whp4khjjp-bot/controlmin/actions/workflows/pages.yml/badge.svg)](https://github.com/2whp4khjjp-bot/controlmin/actions/workflows/pages.yml)

**[Abrir la aplicación](https://2whp4khjjp-bot.github.io/controlmin/)** · [Reportar un problema](https://github.com/2whp4khjjp-bot/controlmin/issues)

Código abierto bajo la licencia MIT.

Aplicación gratuita de control de minutos de fútbol, diseñada para analizar partidos en VEO abierto en otra ventana. Sin registro ni servidor de datos: las fichas, equipos y partidos se guardan en el navegador.

## Ejecutar

Requiere Python 3 para servir los archivos (o cualquier servidor HTTP estático):

```sh
python3 -m http.server 4173 --directory dist
```

Abre http://localhost:4173. También puedes ejecutar `npm run dev`. No requiere instalar dependencias de JavaScript. Node.js 24 o superior se utiliza para las pruebas. No abras index.html mediante file://: los módulos necesitan un servidor HTTP.

«Explorar con datos ficticios» crea una demostración identificada visualmente. «Empezar con mis datos» permite borrarla. Los originales subidos por el propietario permanecen intactos y fuera de este proyecto.

## Funciones

- Equipos múltiples, plantilla permanente y ficha única compartida por jugador.
- Dorsal por equipo y por partido; posiciones opcionales.
- Convocatoria y titulares independientes de la plantilla.
- Fútbol 7 / 11 y partidos de una o dos partes, con tiempos reales de cámara.
- Cambios múltiples, reentradas, cambios de descanso y continuidad automática entre partes.
- Botones independientes para expulsión y lesión sin cambio: salidas definitivas.
- Corrección y borrado cronológicos con validación de eventos posteriores.
- Cálculo exacto en segundos, redondeo independiente de partes y total al minuto más cercano.
- Porcentaje con duración real, añadido incluido y descanso excluido.
- Informe imprimible/PDF con intervalos por jugador y minutos por parte en la misma fila; CSV y texto.
- Historial del jugador en todos los equipos, con filtro por equipo. Acumulados de partidos finalizados.
- Copias JSON: todos los equipos, un equipo o un partido; importación que sustituye el ámbito sin duplicar identidades.
- Descarga y apertura de correo (adjunto manual), o compartir archivo cuando el navegador lo admite.
- Copia local de recuperación anterior a la última importación.
- Ayuda escrita y diseño adaptable a escritorio y móvil.
- Manifest y caché de aplicación para uso sin conexión después de una primera carga, si el navegador lo admite. La instalación depende del navegador.

## Modelo y reglas

`dist/engine.js` es independiente del DOM. Los eventos son la fuente del cálculo. Cada recálculo ordena eventos, valida la alineación y reconstruye intervalos en segundos. No se recrean titulares al recargar. Una modificación incoherente no se guarda.

El informe durante el análisis es provisional: un intervalo abierto llega al fin configurado de su parte. Se incluye en el historial acumulado al finalizar el partido. Reabrirlo lo excluye hasta volver a finalizarlo.

La escala del informe indica tiempo de juego dentro de cada parte. Los cambios se introducen con tiempos de cámara y se muestran como intervalos reales relativos al inicio de cada parte.

Las fichas de los partidos son instantáneas: nombre y dorsal históricos se conservan al editar una plantilla. La ficha única enlaza el historial por ID, no por nombre.

## Datos y seguridad de las copias

Los datos se guardan en `localStorage` bajo `controlmin.v1`, vinculados al navegador y al origen web. Una instalación en otra dirección no comparte el almacenamiento. Para trasladarse a rkoud.com, exporta e importa una copia.

Las copias JSON contienen nombres y estadísticas: compártelas solo con quien corresponda. Al importar se muestra fecha y ámbito, se solicita confirmar la sustitución y se conserva una copia local previa en `controlmin.recovery`. En copias de equipo/partido, los demás ámbitos permanecen; las fichas globales compartidas se actualizan con los datos importados.

No se envían datos a un servidor. El correo se abre en la aplicación del usuario y no se envía automáticamente. No existe servicio de envío ni claves de correo.

## Pruebas

```sh
npm test
```

Instala las dependencias de pruebas con `python3 -m pip install -r requirements-test.txt` y `python3 -m playwright install chromium`. Con el servidor en 4173:

```sh
python3 tests/browser_smoke.py
```

Incluye recarga, corrección, salidas definitivas, PDF, fichas compartidas, exportación/importación, torneo de una parte, cambios múltiples, reentrada y móvil. El script detecta Chromium o utiliza el navegador instalado por Playwright. Puedes indicar `CHROMIUM_PATH`. Los resultados se guardan en `test-results/`.

## Publicación

`dist/` contiene toda la web. GitHub Actions ejecuta las pruebas de cálculo y navegador antes de publicar en GitHub Pages cada cambio de `main`. Las propuestas de cambio ejecutan las pruebas sin publicar. No necesita claves ni servicios externos.

GitHub Pages debe estar configurado con origen **GitHub Actions**. La integración de entrada desde rkoud.com es independiente y todavía está pendiente.

## Pendientes antes de lanzamiento público

- Añadir el acceso desde rkoud.com.
- Validar la experiencia con usuarios reales antes de difundirla.
- Grabar los vídeos de guía con el flujo validado.
- Modo en vivo: esta versión se centra en análisis de vídeo con tiempos manuales.
- Compatibilidad de importación con los JSON de la aplicación antigua: no implementada; las copias nuevas usan esquema versionado.

## Estructura

- `dist/`: aplicación estática.
- `tests/`: pruebas de cálculo y del flujo en navegador.
- `docs/`: capturas e informe de prueba generado por el navegador.
- `.github/workflows/pages.yml`: pruebas y publicación automática.

## Licencia

MIT · Copyright (c) 2026 rkoud. Consulta [LICENSE](LICENSE).
