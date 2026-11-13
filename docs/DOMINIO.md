# TimeControl en rkoud.com

## Estado

La aplicación se publica y funciona en https://2whp4khjjp-bot.github.io/controlmin/.
La marca es TimeControl · por rkoud. No se cambia el nombre del repositorio para conservar enlaces y el almacenamiento del navegador.

El DNS autoritativo de rkoud.com usa ns97.piensasolutions.com y ns98.piensasolutions.com. El subdominio timecontrol.rkoud.com todavía no tiene registro DNS. La conexión GitHub de este proyecto no tiene permisos administrativos para configurar Pages.

## Pasos para conectar el dominio

1. En el panel DNS de Piensa Solutions, añadir:

| Tipo | Nombre / host | Destino | TTL |
| --- | --- | --- | --- |
| CNAME | timecontrol | 2whp4khjjp-bot.github.io | Por defecto |

El destino no lleva https:// ni /controlmin/. No modificar los registros de la web principal ni del correo.

2. Tras comprobar que resuelve, ir a GitHub → controlmin → Settings → Pages → Custom domain, introducir `timecontrol.rkoud.com` y guardar.
3. Esperar a que GitHub complete la comprobación y emita el certificado. Activar Enforce HTTPS cuando esté disponible.
4. Con la configuración ya comprobada, añadir `dist/CNAME` con `timecontrol.rkoud.com` para documentarla en los artefactos publicados.
5. Comprobar acceso público, instalación, exportación e importación desde el dominio definitivo.
6. Añadir en rkoud.com una tarjeta o botón «Usar TimeControl gratis» enlazado al subdominio. Hasta que el dominio esté operativo se puede enlazar a la URL de GitHub Pages.

## Datos existentes

El almacenamiento del navegador depende del dominio. Antes de pasar al nuevo dominio, exportar una copia desde la dirección antigua; importarla en la nueva. El cambio de marca en la dirección actual conserva automáticamente los datos, las fichas y las copias de recuperación.

Los archivos antiguos con marca ControlMin y los nuevos con marca TimeControl son compatibles. Los identificadores y las claves internas se mantienen.
