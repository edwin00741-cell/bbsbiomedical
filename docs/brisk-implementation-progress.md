# Implementación de la réplica de Brisk en BBS Control

Actualizado: 26 de octubre de 2026.

Estado actual: circuito interno implementado localmente: clientes, catálogo/inventario, cotizaciones/estimados, facturas, pagos, créditos, reembolsos, recurrencias, entregas, informes, importaciones y configuración efectiva. Trece migraciones de estas entregas están aplicadas al proyecto vinculado. Por decisión del usuario, los pagos se registran como transferencias, efectivo y Yappy; el correo empresarial usará SMTP y su configuración se pospone. El usuario cree que el correo está alojado en GoDaddy, pendiente de confirmar. El envío real permanece deshabilitado y los formularios muestran esa dependencia.

## Primera entrega

La base visual y el primer recorrido de consulta están implementados localmente. La réplica completa continúa pendiente; esta entrega no habilita emisión de facturas ni movimientos financieros.

| Área | Implementado | Pendiente |
|---|---|---|
| Diseño compartido | Barra lateral de 256 px, enlaces directos e indentados, sección activa, colores, títulos, campos y botones compactos, tablas alternadas | Ajustar formularios antiguos al editor común |
| Móvil | Menú de módulos desplegable, filtros en columna y tablas con desplazamiento contenido | Comparación contra una referencia móvil de Brisk |
| Panel | Crear, facturas pendientes, filtros y paginación, tareas comunes, seis meses de cobros netos | Accesos de creación financiera, edición y pagos desde filas |
| Cotizaciones | Tabla compacta, períodos efectivos, búsqueda literal con puntuación, filtro correctamente llamado Estado, paginación real, menú sin recortes, confirmación de borrado, estados vacío/error | Estimados, tipo independiente, impuestos, descuentos y envío estructurados, conversión a factura |
| Facturas | Consulta de emitidas/borradores, filtros, paginación y diálogo de detalle con líneas y saldo | Alta, edición, PDF, correo, notas de entrega, etiquetas y recurrencia |
| Datos | Autenticación y autorización existentes conservadas; errores visibles; ingresos sin truncamiento por límite de filas de la API | Nuevas relaciones y transacciones de módulos financieros |

Los accesos financieros aún no operativos aparecen deshabilitados en el bloque Crear. Los accesos a clientes, cotizaciones, artículos y usuarios usan las funciones existentes. La navegación mantiene visibles los módulos que aún conservan su estructura anterior.

## Decisiones verificadas

- El proyecto vinculado usa `completed/pending/failed/refunded` en pagos y `draft/sent/completed/void` en reembolsos. La migración inicial del repositorio describe otros nombres. Los cálculos reconocen los estados de ambas variantes y excluyen operaciones pendientes, fallidas o anuladas. No se alteraron enums ni datos.
- Ingresos representa pagos completados menos reembolsos completados, por fecha de movimiento. Cotizaciones y facturas por cobrar no cuentan como ingreso.
- Los períodos usan el calendario de America/Panama. Semanas empiezan en lunes; últimos 7 y 30 días incluyen el día actual. Fechas inválidas o invertidas producen error visible.
- Las consultas mantienen orden estable, total exacto y 20 registros por página. Una página fuera del resultado redirige a la última válida, conservando filtros.
- Se eliminó `baseUrl` de TypeScript porque la versión instalada lo considera obsoleto. Los alias ya usan rutas relativas en `paths`; compilación y resolución siguen funcionando.

## Validación de esta entrega

Historia comprobada: sesión interna → panel/listado → consultas con permisos del usuario → resultados → filtros, paginación y detalle.

| Comprobación | Resultado |
|---|---|
| Pruebas automatizadas | 10 pasan: 6 nuevas de períodos, filtros, importes y agregación; 4 existentes de cotizaciones |
| TypeScript | Sin errores |
| ESLint de archivos nuevos/modificados de esta entrega | Sin errores |
| Compilación de producción | Correcta |
| Panel de escritorio | Facturas vacías y seis meses reales sin errores de consulta |
| Navegador autenticado | Seis cotizaciones consultables; navegación activa correcta |
| Filtros | Mes calcula fechas; cambio manual activa Personalizar; rango invertido bloquea Buscar; fecha imposible en URL muestra error |
| Búsqueda | Sin coincidencias y con comas, paréntesis y porcentaje; sin error de consulta |
| Paginación | URL con página 900 vuelve a página 1 en el conjunto actual |
| Menús | Apertura, cierre con Escape y posicionamiento dentro de ventana en escritorio/móvil |
| Diálogo de factura | Estado no encontrado y cierre con botón/Escape comprobados |
| Móvil a 390 px | Panel, navegación, listado y editor de cotización existente sin desbordamiento horizontal de página |
| Sesión ausente | Redirección a `/bbs-control/login` |
| Errores del navegador | Ninguna excepción de página durante recorrido final |

La base está vacía en facturas/pagos/reembolsos; no se insertaron documentos financieros de prueba en producción. Las filas no vacías de factura y la ejecución de movimientos reales requieren validación posterior en un entorno de prueba. El cálculo de saldo, redondeo y movimientos sí tiene pruebas automatizadas con datos sintéticos.

Capturas de esta entrega: [panel de escritorio](bbs-replica-panel-desktop.png), [panel móvil](bbs-replica-panel-mobile.png).

## Segunda entrega Clientes y condiciones comerciales

Implementación local completada el 26 de octubre de 2026; dos migraciones aplicadas al proyecto Supabase vinculado.

- Directorio con diseño de Brisk, búsqueda por nombre/correo/vendedor, inactivos, paginación, saldo, vencimiento, última factura y vista previa.
- Alta y edición en ventana: contacto, direcciones independientes, vendedor, grupo, activo, COD/días, método de pago, exención, información impresa, nota privada y pie público.
- Grupos y vendedores con creación, edición y borrado de registros sin asignaciones; métodos de pago con alta y edición. Catálogos se pueden abrir desde el cliente sin perder lo escrito.
- Guardados conservan valores ante errores y detectan una edición concurrente. Reactivación y desactivación mantienen historial.
- Borrado de clientes sin documentos; cinco referencias comerciales protegidas en base para impedir pérdida de historial de clientes con documentos.
- Cotizaciones excluyen inactivos de selección nueva, conservan el cliente histórico en edición y heredan vendedor al seleccionar cliente.
- Estado de cuenta con facturas emitidas, total/pagado/saldo, logo BBS, información pública, pie y paginación. Ruta autenticada, descarga/vista/impresión y notas privadas excluidas desde la consulta.
- Formulario de correo con destinatarios editables, asunto, mensaje, PDF adjunto y clave de idempotencia. Usa la conexión Resend existente; no se enviaron correos de prueba.

### Verificación

- 15 pruebas automatizadas pasan, incluyendo validaciones de condiciones y destinatarios; TypeScript, ESLint y compilación de producción correctos.
- Navegador: alta real de cliente de prueba con grupo anidado, pago a 45 días, exención, dos direcciones y notas separadas. Edición posterior COD normaliza días a cero.
- Error de edición concurrente conserva cambios escritos; grupo duplicado conserva nombre; grupo asignado rechaza borrado; renombrado se refleja en clientes.
- Inactivo desaparece del selector de nuevas cotizaciones, aparece al incluir inactivos y puede reactivarse. Vendedor predeterminado se hereda.
- Alta de vendedor/método desde ventanas anidadas conserva formulario y selecciona el registro creado.
- Borrado de cliente sin historial comprobado desde interfaz. Registros de prueba retirados: cero clientes/grupos/vendedores/métodos de esta prueba permanecen.
- Prueba SQL transaccional con rollback: factura 100 y pago aplicado 30 producen saldo 70, vencimiento y última factura correctos; borrado con historial bloqueado. Usuario sin perfil no puede leer directorio ni crear grupos.
- RLS activado en tablas nuevas; vista con `security_invoker=true`; acceso anónimo a grupos bloqueado y PDF devuelve 401.
- PDF revisado visualmente con datos sintéticos: documento de 75 facturas en cuatro páginas, encabezados repetidos, última factura y saldo completo. Extracción confirma ausencia de nota privada y presencia del pie público.
- Formulario de correo: destinatario precargado y rechazo de dirección inválida comprobados; entrega del proveedor no ejercitada.
- Revisión móvil a 390 px sin desbordamiento horizontal de página. Ventanas admiten desplazamiento vertical interno.

Capturas con datos de demostración: [formulario de cliente](bbs-replica-client-form.png), [formulario móvil](bbs-replica-client-mobile.png), [directorio](bbs-replica-clients-desktop.png).

### Límites y siguientes dependencias

El enlace público de pago requiere la integración de cobros y no se presenta como disponible. La aplicación de condiciones, direcciones y exención a las instantáneas de futuros documentos queda vinculada al editor común; en esta entrega se guardan y se consultan en el perfil, y se conecta vendedor e inactivos con el editor existente. El saldo del estado de cuenta utiliza facturas y sus importes aplicados actuales; créditos y pagos no aplicados se integrarán al implementar esos módulos.

El asesor de seguridad solo reportó el aviso previo de [protección contra contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No se cambiaron credenciales ni preferencias de autenticación.

## Tercera entrega Editor de cotizaciones y facturas

Implementación completada con tres agentes en paralelo (editor, guardado/cálculo y PDF), seguida de integración y pruebas de navegador del agente principal.

| Área | Resultado |
|---|---|
| Editor común | Alta/edición de cotizaciones, estimados y facturas con diseño compacto de Brisk; catálogo, líneas manuales, cantidades fraccionarias y orden de compra |
| Condiciones | Seleccionar cliente hereda vendedor, facturación, envío, COD/días, método y exención. Cada documento guarda su copia; editar el cliente después no altera lo emitido |
| Importes | Descuento fijo, porcentual o por línea; reparto proporcional del descuento global entre líneas; impuesto sobre la base descontada; envío separado con impuesto propio |
| Exención | Suprime impuestos de artículos y envío; mantiene los tipos guardados para recalcular al retirar la exención |
| Facturas | Borrador, emisión, vencimiento calculado, edición de importes sin pagos y duplicado nuevo en borrador |
| Conversión | Cotización a factura conserva líneas, condiciones, notas y empresa emisora. Reintentos no duplican; acceso repetido abre la factura existente |
| Historial | Versiones comerciales nuevas separadas de documentos antiguos; PDFs previos de cotizaciones conservan su renderer. Facturas con pagos/parciales/anuladas quedan en solo lectura |
| Salidas | Detalle, descarga, impresión y PDF previo sin guardar. Correo con destinatarios/asunto/mensaje editables y PDF adjunto mediante Resend existente |
| Notas | Pública, privada y pie independientes; la privada permanece dentro de BBS Control y se excluye del PDF adjunto |
| Integridad | Guardado atómico con autorización del usuario, importes recalculados en base, control de edición concurrente, idempotencia y referencia de origen protegida |

Migraciones aplicadas: `20261026230301_commercial_document_editor.sql` y `20261026231330_preserve_conversion_business_snapshot.sql`. No se reescribieron importes de documentos anteriores.

### Verificación final

- 22 pruebas automatizadas pasan; incluyen siete casos nuevos de cálculo/validación comercial.
- 40 escenarios comparan JavaScript y SQL al centavo: impuesto mixto, descuento fijo/porcentaje/por línea, envío y exención. Transacción con rollback; también cubre idempotencia, payload distinto, edición concurrente, conversión única, emisión, vencimiento, notas separadas y bloqueo con pagos. Fuente reproducible: `tests/commercial-documents.integration.sql`.
- TypeScript y compilación de producción pasan. ESLint sin errores; persiste un aviso previo de imagen en `app/global-reach-map.tsx`, ajeno al editor.
- Navegador autenticado: cotización de subtotal 250, descuento 25, envío 10 e impuestos 13.30 da total 248.30 tanto en pantalla/base como en PDF. Factura convertida conserva el mismo total y vence a los 15 días.
- Cambio del cliente a 45 días, nueva dirección y exención afecta documentos nuevos; la cotización guardada y su factura mantienen 15 días y dirección original.
- Borrador emitido desde interfaz; duplicado en borrador sin saldo pagado ni vínculo de conversión; factura con pagos bloqueada en pantalla y servidor.
- Conflicto de edición presenta error y conserva el dato escrito. Descartar restaura los datos cargados. Cancelar descuento/envío no aplica cambios.
- Exención baja el total de la prueba a 235.00 sin impuestos; descuento por línea de 50% y 20% produce 157.70 en pantalla y base.
- Catálogo rellena descripción y precio; estimados se guardan y filtran por Tipo independientemente de Estado.
- PDF de cotización, factura y vista previa válidos, con total/notas públicas/pie presentes y sentinel privado ausente. PDF sintético de 75 líneas y descripciones extensas revisado visualmente, con encabezados y pies en todas las páginas.
- Vista previa no inserta documentos; PDF y preview sin sesión devuelven 401. Ninguna excepción de página durante el recorrido.
- Móvil a 390 px: página de 390 px, tabla de 930 px con desplazamiento dentro de un contenedor de 326 px. Corregida referencia de un texto de accesibilidad que provocaba desbordamiento.
- Todos los clientes, vendedores, cotizaciones, facturas y eventos creados para esta prueba fueron retirados; cero documentos/ clientes de esta prueba permanecen. No se enviaron correos externos de prueba.

Capturas: [editor de escritorio](bbs-replica-document-editor.png), [editor móvil](bbs-replica-document-mobile.png).

El formulario de correo y su integración están conectados; no se ejercitó una entrega real del proveedor. Esta entrega se verifica localmente y no constituye un despliegue del sitio público.

## Cuarta entrega Circuito interno completo

Se sustituyeron las pantallas preparatorias de pagos, notas de crédito, reembolsos, informes, herramientas y ayuda por recorridos operativos, con tres agentes en paralelo y revisión final del agente principal.

| Módulo | Funcionamiento implementado |
|---|---|
| Pagos | Registro por cliente, fecha/método/referencia; reparto entre varias facturas; remanente disponible; aplicar después, deshacer, editar metadatos con versión, anular si no se utiliza; recibo PDF |
| Créditos | Creación manual o desde factura con artículos/impuestos/descuentos/envío/notas; importe aplicado/disponible; edición antes de usos, aplicaciones parciales y reversión, anulación, PDF |
| Reembolsos | Efectivo no aplicado o devolución de factura pagada respaldada por crédito; sustitución atómica efectivo→crédito sin reabrir deuda; reversión del reembolso y comprobante |
| Saldos | Efectivo aplicado y crédito aplicado independientes; saldo, estado de factura, directorio y estado de cuenta usan ambos. Un crédito por sí solo no crea ingreso ni salida de caja |
| Integridad | RPCs con autorización, transacción, bloqueo por cliente, reintentos identificados, datos financieros protegidos frente a escritura directa y eventos conservados. Implementaciones privilegiadas privadas; API pública invoker |
| Inventario | Edición/activación de artículo, impuesto predeterminado, cantidad/ideal/umbral/proveedor/nota interna; historial de ajustes; emisión/edición/anulación de factura modifica existencias, cotizaciones no |
| Recurrencias | Plantilla desde factura, intervalo diario/semanal/mensual/anual, fecha inicial/final, pausa/reactivación, historial y generación manual; cron real cada 15 minutos, límite por ejecución y sin doble emisión |
| Entregas | Nota de entrega con cantidades sin precios y etiqueta 4×6 con remitente/destinatario; PDFs autenticados para factura emitida |
| Informes | Los 13 informes del inventario de referencia, agrupados; filtros de período/cliente/vendedor; antigüedad reconstruida al corte, ventas/impuestos netos de crédito, caja neta de reembolsos, inventario histórico; pantalla/PDF/CSV comparten cálculo |
| Importaciones | CSV con archivo o texto, separador, mapeo y línea inicial; validación y vista previa; clientes/artículos/documentos de varias líneas; lote atómico e historial, sobrescritura controlada de catálogo, deshacer protegido por referencias/versión |
| Configuración | Empresa/RUC/web, prefijos, vigencia/plazo, impuestos/default, papel Carta/A4/Legal, plantilla clásica/minimalista, color, títulos, columnas, sombreado, fechas y notas; ajustes reflejados en documentos nuevos y snapshots conservados |
| Navegación/ayuda | Todos los accesos Crear operativos; guardar→correo/PDF/pago/recurrencia; acciones financieras/entrega desde factura; guías propias de BBS y administración de métodos/vendedores/usuarios |

La moneda base queda fijada por el historial y no puede reinterpretarse al guardar otra divisa. Documentos nuevos de factura requieren cliente registrado para poder liquidarse posteriormente. Registros financieros históricos previos al nuevo libro quedan en modo consulta.

### Validación final

- 35 pruebas de dominio pasan, incluidas 10 de informes y 3 de CSV/fechas contables/saldo con créditos. TypeScript y compilación de producción correctos; lint sin errores y un aviso de imagen previo ajeno al módulo.
- Suites SQL reproducibles con rollback: documentos comerciales (40 escenarios JS/SQL), crédito (40 escenarios JS/SQL), flujos financieros, importaciones/deshacer, recurrencia/calendario/idempotencia y moneda. Comprobaciones de permisos y aislamiento anónimo incluidas.
- Pago 150 aplicado 100+30 conserva 20; aplicar/deshacer el sobrante no duplica ingreso. Crédito, aplicación parcial, edición antes de uso y anulaciones comprobados desde interfaz.
- Devolución de factura pagada comprobada: efectivo80 + crédito20 mantienen la factura saldada; devolver20 registra salida20. Anular restaura efectivo100 + crédito0. No se ejecutó una transferencia bancaria externa: estos son registros contables del dinero recibido/devuelto.
- Edición concurrente de pago rechazada y campos conservados; void inseguro conserva motivo y presenta error; aplicación ligada a reembolso no ofrece una reversión imposible.
- Catálogo en navegador: stock inicial10 → borrador10 → emisión de2 unidades8 → edición a3 unidades7 → factura recurrente de3 unidades4 → anulación de ambas devuelve10. Impuesto/valor/descripción se precargan del catálogo; nota interna ausente en PDF.
- Importación real de prueba: vista previa, confirmación, COD normalizado a0 días y deshacer completo desde historial. Archivo inválido no deja registros parciales; sobrescribir/deshacer y registros modificados cubiertos en SQL.
- Recurrencia creada y ejecutada desde interfaz: una factura32.10, misma empresa/plazo/total; segunda ejecución sin duplicado y fecha final completada. Cron instalado, activo y con ejecución correcta observada.
- Los 13 CSV responden200 autenticado; PDF de antigüedad coincide con pantalla/CSV (dos facturas32.10 y saldo64.20). Sin sesión devuelve401.
- Recibos reales de pago/crédito/reembolso responden200; privado ausente y público presente. PDFs sintéticos extensos de créditos, recibos, informes y entrega revisados por páginas completas y extracción de última línea/totales.
- Ajustes de diseño guardados desde interfaz y verificados en PDF previo: papel Legal612×1008, título personalizado, fecha26/10/2026 y nota predeterminada. Se restauraron después todos los ajustes originales de BBS.
- Móvil390px: pagos/créditos, catálogo, importaciones, configuración, informes y recurrencias sin desbordamiento de página. Tablas mantienen desplazamiento interno. Cero excepciones de página.
- Los registros temporales de ambos recorridos de navegador se retiraron por sus identificadores exactos después de revertir sus movimientos. Cero clientes/facturas/artículos de esas pruebas permanecen; no se reinició la numeración ni se modificaron documentos reales.

Capturas: [crédito escritorio](bbs-finance-credit-desktop.png), [crédito móvil](bbs-finance-credit-mobile.png), [pago móvil](bbs-finance-payment-mobile.png), [informe](bbs-replica-reports-desktop.png), [operaciones móvil](bbs-replica-operations-mobile.png), [configuración móvil](bbs-replica-settings-mobile.png).

### Dependencias externas y alcance pendiente

Decisiones confirmadas por el usuario el 26 de octubre de 2026: registrar transferencias, efectivo y Yappy, sin pasarela de pago en línea; usar correo empresarial por SMTP. El usuario pidió dejar la configuración del correo para después e indicó GoDaddy como proveedor probable, sin confirmarlo. No solicitar credenciales ni activar envíos hasta que retome esa configuración. El proveedor no está configurado localmente ni en Vercel; el código de envío actual usa Resend y la adaptación al SMTP empresarial queda pendiente para esa etapa. No se declararon entregas reales ni se enviaron correos de prueba. No se activaron SMS, suscripciones de terceros ni cargos externos. La galería y opciones propias de diseño de Brisk no se certifican como idénticas en todas sus variantes; se implementaron preferencias de BBS con efecto verificable.

Esta entrega está verificada localmente y las migraciones están aplicadas al proyecto vinculado. No se desplegó el código al sitio público.

## Quinta entrega Accesos, roles y publicación en producción

Publicado el 26 de octubre de 2026 (Panamá) en https://bbsbiomedical.com/bbs-control/login. Despliegue Vercel `dpl_GVUhixYT9rHvVxeLKnbBCrn55hWs`, estado READY y dominio de producción asignado.

| Rol | Alcance |
|---|---|
| Cotizador | Crea cotizaciones para clientes registrados y consulta las propias. Edita sus cotizaciones abiertas/enviadas; las revisadas quedan en solo lectura. No administra clientes, usuarios ni módulos financieros |
| Aprobador | Gestiona clientes, grupos, vendedores y métodos comerciales; consulta y aprueba cotizaciones. No administra usuarios ni finanzas |
| Administrador | Gestiona módulos y usuarios cotizador/aprobador/admin. No puede modificar ni recuperar cuentas superadministradoras |
| Superadministrador | Acceso completo; reservado a `bryanrodriguez`, `edwin00741` y `edwin00741_gmail`. No se ofrecen altas adicionales con este rol |

Los permisos se verifican en navegación, páginas, acciones, APIs y políticas de base de datos. El directorio y el catálogo utilizados por el cotizador no exponen saldos, existencias ni notas privadas. Los perfiles no admiten cambios directos que permitan elevar privilegios.

Inicio de sesión por usuario o correo, botón Entrar visible, mostrar/ocultar contraseña y cambio personal de contraseña. Las cuentas temporales deben establecer una contraseña propia antes de entrar a los módulos; la restricción también se aplica a llamadas directas a datos. Recuperación sin correo: el usuario registra una solicitud y un administrador autorizado genera un enlace de un solo uso o establece una contraseña temporal. Los enlaces usan el dominio de producción, sin depender del correo pendiente.

Se crearon desde la interfaz `prueba.cotizador`, `prueba.aprobador` y `prueba.admin`. Sus contraseñas temporales están en `.bbs-private/accesos-prueba-bbs.md`, excluido de Git y del despliegue. Las tres conservan cambio obligatorio en el primer acceso. No se cambiaron contraseñas de las cuentas existentes.

### Verificación

- 54 pruebas automatizadas pasan; TypeScript y compilación local y Vercel correctas. ESLint sin errores, con el aviso de imagen previo del sitio público.
- Pruebas SQL de roles y regresión financiera aprobadas con rollback: aislamiento de cotizaciones propias, bloqueo de autoaprobación y transferencia de autor, revisión y líneas protegidas, creación de clientes solo autorizada, restricciones de usuarios y bloqueo de cuentas inactivas/con cambio pendiente.
- Navegador local: las tres cuentas inician sesión y llegan al cambio obligatorio. Menús y acceso directo a Usuarios se restringen por rol. Cotizador crea cotización heredando 30 días del cliente; aprobador la aprueba y el editor del cotizador queda en solo lectura. Esa cotización temporal fue eliminada; no se reinició la numeración.
- Recuperación probada: validación de contraseña actual, confirmación, enlace válido, rechazo de enlace reutilizado, resolución de solicitud y revocación de otras sesiones. Cuenta QA eliminada por su identificador exacto.
- Producción: panel y 18 pantallas de módulos/formularios responden 200 sin errores de datos ni excepciones del navegador. Login móvil de cotizador confirmado con cambio obligatorio y sin desbordamiento a 390 px.
- Producción: exactamente los tres superadministradores solicitados; generación y consumo de enlace de recuperación en el dominio correcto, rechazo al reutilizarlo; descarga de cotización PDF válida y vista previa comercial PDF de 360621 bytes sin guardar documento.
- Correo empresarial SMTP sigue pendiente por solicitud expresa del usuario. No se enviaron correos externos ni se activaron pasarelas de pago.

Captura pública sin credenciales: [login en producción](bbs-production-login.png).
