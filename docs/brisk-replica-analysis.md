# Análisis de Brisk Invoicing para la réplica en BBS Control

Fecha: 26 de octubre de 2026. Referencia: interfaz española de [Brisk Invoicing](https://run.briskinvoicing.com/es/dashboard.html). Destino: `/bbs-control` del proyecto BBS Services.

La réplica requiere reconstruir tanto la interfaz como el ciclo comercial completo. BBS ya tiene autenticación, administración de usuarios, clientes básicos, catálogo básico y cotizaciones con PDF y acciones de correo. Facturas, créditos, pagos, reembolsos, informes y herramientas son principalmente pantallas de estructura. Tener sus rutas y tablas no equivale a tener sus operaciones.

## Alcance y grado de verificación

- **Observado**: navegación con sesión existente; panel; directorio, formulario, acciones y vista previa de clientes; grupos; listados y editor de facturas y cotizaciones; menús de acciones; descuento; editor de crédito y selección de factura; formulario de pago; selector inicial de reembolso; artículos y formulario; catálogo de informes; opciones de salida de un informe; importaciones; configuración y ayuda.
- **Documentado**: comportamiento complementario descrito por el manual oficial, citado donde aporta información que no se ejercitó.
- **Propuesto**: estructura de implementación y pruebas de BBS. No describe el código interno de Brisk, al que no se accedió.
- **Pendiente de verificar**: resultados de guardar, enviar, borrar, aplicar dinero o crédito, ejecutar importaciones, generar recurrencias y configurar pasarelas. No se efectuaron esas operaciones sobre la cuenta de referencia.
- Agregar un usuario mostró un bloqueo por límite del plan. No se accedió a la definición completa de privilegios ni se modificó la suscripción.
- No se copiaron registros comerciales, credenciales, logotipos ni información de clientes de Brisk al proyecto. Los ejemplos de aceptación deben usar datos de prueba de BBS.
- La inspección visual corresponde al escritorio, en capturas de aproximadamente 2560 px de ancho. Móvil, zoom, teclado, estados de error y todos los PDFs requieren una pasada de validación específica.

## 1. Estructura de navegación

| Brisk | Ruta de referencia | Destino BBS | Situación local revisada |
|---|---|---|---|
| Panel | `dashboard.html` | `/bbs-control` | Conteos y cotizaciones recientes; composición diferente |
| Clientes | `customers.html` | `/bbs-control/clientes` | Alta y edición básicas; faltan grupos, saldo y estados de cuenta |
| Facturas | `invoices.html` | `/bbs-control/facturas` | Tabla genérica |
| Nueva factura | `new-invoice.html` | `/bbs-control/facturas/nueva` | Pantalla informativa; sin editor operativo |
| Cotizaciones | `quotes.html` | `/bbs-control/cotizaciones` | Listado y acciones parciales |
| Nueva cotización | `new-quote.html` | `/bbs-control/cotizaciones/nueva` | Editor operativo parcial |
| Notas de crédito | `creditnotes.html` | `/bbs-control/notas-credito` | Tabla genérica |
| Pagos | `payments.html` | `/bbs-control/pagos` | Tabla genérica |
| Reembolsos | `refunds.html` | `/bbs-control/reembolsos` | Tabla genérica |
| Artículos | `items.html` | `/bbs-control/articulos` | Alta y listado básicos |
| Informes | `reports.html` | `/bbs-control/informes` | Lista descriptiva sin generador |
| Herramientas | `tools.html` | `/bbs-control/herramientas` | Lista descriptiva sin importador |
| Configuración | `settings.html` | `/bbs-control/configuracion` | Datos de empresa básicos |
| Ayuda | `help.html` | `/bbs-control/ayuda` | Contenido descriptivo |
| Asistencia | Enlace de correo | Canal de BBS por definir | No enviar al soporte de Brisk |
| Sugerencias | `feedback.html` | Canal de BBS por definir | Formulario aún sin inspección detallada |
| Cuenta y salida | Pie de barra lateral | Usuarios y cierre de sesión existentes | Conservar permisos actuales |

Brisk muestra Facturas y Cotizaciones como enlaces directos y agrega debajo Nueva factura y Nueva cotización. BBS usa grupos desplegables y agrega Usuarios al menú principal. Para fidelidad, los accesos comerciales deben conservar el orden y la jerarquía de la referencia; Usuarios puede ubicarse también dentro de Configuración.

## 2. Diseño compartido

### Apariencia observada

- Barra lateral fija azul grisáceo, aproximadamente 256 px en la captura de escritorio. Marca arriba, módulos en columna, ayuda y cuenta abajo.
- Contenido principal desde aproximadamente x=304: separación lateral cercana a 48 px respecto de la barra.
- Fondo muy claro con tinte frío; grandes títulos azul grisáceo y peso normal. Tipografía visualmente equivalente a Arial/sans-serif, pendiente de medir mediante estilos de elementos.
- Filas de navegación cercanas a 50 px de alto; sección activa blanca con texto oscuro. Accesos de creación indentados.
- Botones principales verdes, rectangulares, compactos. Secundarios claros con borde gris; sin las píldoras y sombras prominentes de BBS actual.
- Filtros compactos en línea. Tablas de ancho disponible, cabecera gris medio con texto blanco, filas alternas blancas/gris claro y números alineados a la derecha.
- Menú contextual en cada fila. Formularios secundarios en ventanas superpuestas; editores principales de factura y cotización ocupan la página.
- Configuración agrega una segunda columna de navegación y una superficie blanca para el formulario seleccionado.

### Componentes que debe tener BBS

`CommercialShell`, navegación activa, encabezado con acciones, filtro de períodos, selector de cliente/vendedor/artículo, tabla con paginación, menú de acciones, ventana accesible, pestañas de notas, editor de líneas, resumen de importes, mensajes de error/éxito y vista previa PDF.

Las medidas anteriores son estimaciones de capturas, no tokens CSS extraídos. La aceptación visual exige comparar capturas a igual resolución. Conservar identidad y datos de BBS; reconstruir estructura y comportamiento. El aviso de suscripción de la cuenta y la franja amarilla de instrucciones del entorno observado no son contenido comercial de BBS.

## 3. Panel

**Composición observada:**

1. Bloque Crear con ocho accesos: Factura, Recurrente, Cliente, Cotización, Nota de crédito, Pago, Artículo e Invitar usuario.
2. Facturas pendientes: período, inicio, fin, palabra clave y Buscar.
3. Tabla: Fecha, Número, Cliente, Importe a pagar, Total, Estado, Enviado y Acción. Acciones visibles de Pago, Editar y menú adicional.
4. Tareas comunes, con accesos a creación y configuración.
5. Ingresos por mes, gráfico de seis meses en la cuenta observada.

**BBS:** sustituir la composición de tres tarjetas de conteos y cotizaciones recientes por esos bloques. Datos deben proceder de operaciones reales. Si falla una consulta, mostrar error; no convertir una falla en saldo cero. No usar cotizaciones como ingresos cobrados. La base exacta del gráfico de Brisk requiere reconciliarlo con pagos en un entorno de prueba.

## 4. Clientes y grupos

**Listado observado:** búsqueda por nombre, correo o vendedor; incluir inactivos; columnas Nombre, Saldo, Fecha de vencimiento, Última factura, Vendedor, Grupo, Correo electrónico y Acción.

**Formulario observado:** nombre, correo, teléfono, contacto opcional, vendedor, grupo, dirección de facturación, dirección de envío, activo, nota privada, pie del estado de cuenta, información impresa adicional, condiciones COD o días, cantidad de días, método de pago y exención de impuestos.

**Selección y acciones observadas:** vista previa del cliente bajo la tabla; editar; descargar/ver PDF; imprimir y enviar estado de cuenta; copiar enlace de pago; borrar. Grupos abre un diálogo con búsqueda, listado y Nuevo grupo.

**Brecha local:** `ClientFields` y la validación solo cubren nombre, contacto, correo, teléfono, una dirección y notas. Faltan atributos comerciales y cálculo de saldo. El saldo debe derivarse de movimientos aplicados, no de un campo editable manualmente.

**Aceptación:** buscar y editar un cliente sin perder sus condiciones; excluir inactivos de selectores normales; mantener dirección de envío independiente; estado de cuenta coherente con movimientos; notas privadas ausentes en documentos públicos. El manual confirma que las condiciones, método y vendedor son valores predeterminados del cliente. [Manual de clientes](https://run.briskinvoicing.com/es/help/customers_help.html).

## 5. Facturas y recurrentes

### Listado observado

Filtros: período, inicio, fin, cliente, palabra clave y selector Ver con Facturas, Recurrente y Borrador. Tabla: Fecha, Número, Cliente, Importe a pagar, Total, Estado, Correo electrónico y Acción.

Menú de una factura: editar, correo electrónico, descargar PDF, ver PDF, imprimir factura, nota de entrega, etiqueta de envío, crear duplicado, pago, marcar como enviado y borrar.

### Editor observado

- Empresa y logo; cliente; fecha; número; condiciones COD/días; orden de compra; vendedor; dos direcciones y campos adicionales.
- Líneas: cantidad, código, descripción, precio unitario, impuesto y total; encabezados personalizables.
- Agregar artículo, descuento y envío. Descuento abre selección de importe fijo, porcentaje global o descuento por línea.
- Notas pública, privada y al pie; subtotal y total.
- Limpiar, vista previa y botón dividido de creación: crear, crear y enviar, crear e imprimir, recurrente, borrador, crear y previsualizar, crear y aplicar pago, guardar y descargar.
- Apertura de Recurrente desde el panel conduce a `new-invoice.html?showinvoice=2`, con número no editable y Guardar recurrente.

El manual describe programación por fecha inicial, intervalo y acción; las facturas recurrentes generan facturas normales y no reciben pagos directamente. La programación y generación no se ejecutaron. [Manual de facturas](https://run.briskinvoicing.com/es/help/invoices_help.html).

**Brecha local:** existen `invoices` e `invoice_items`, pero la ruta nueva no contiene formulario ni acciones de guardado. Faltan direcciones del documento, orden de compra, descuentos, envío, notas separadas, recurrencia, entrega, etiquetas, PDF y correo de factura.

**Aceptación:** crear y reabrir documento con importes idénticos; duplicar con identidad nueva; pago parcial reduce pendiente; vencimiento cambia presentación según fecha; borrador y recurrente se separan de emitidas; convertir cotización precarga sus datos; doble clic/reintento no duplica emisión ni cobro.

## 6. Cotizaciones y estimados

**Listado observado:** período, fechas, palabra clave y Tipo: Todos/Cotizaciones/Estimados. Columnas Fecha, Número, Tipo, Cliente, Vendedor, Total, Estado, Enviado y Acción. Paginación real en la referencia.

**Acciones observadas:** Factura, Editar, Descargar PDF, Ver PDF, Imprimir cotización, Crear duplicado, Correo electrónico y Borrar.

**Editor observado:** cliente, fecha, número, condiciones de pago, vendedor, dos direcciones, líneas con impuesto, descuento y envío, tres pestañas de notas. Creación normal, como estimado, con correo, con impresión o con vista previa.

**Brechas concretas en BBS:**

- El selector llamado Tipo filtra `status`; debe existir `document_kind` independiente del estado.
- El selector Período se presenta, pero la consulta solo usa fechas explícitas. Elegir Hoy o Este mes no calcula un rango.
- El enlace Factura va a una ruta vacía y no transporta la cotización elegida.
- Pie de paginación fijo en página 1 de 1; no implementa navegación por conjuntos de registros.
- Solo una nota persistida. Descuento y envío del editor actual se representan como líneas; no equivalen a la selección de descuento de Brisk.
- Impuestos por línea, direcciones del documento, pie global y estimados no tienen paridad.

Mantener el guardado atómico y cálculo monetario de los cambios locales existentes. No reemplazarlos por una inserción en varias solicitudes sin transacción. El manual especifica que nota privada no aparece en PDF y que editar nota al pie modifica el valor compartido para cotizaciones. [Manual de cotizaciones](https://run.briskinvoicing.com/es/help/quotes_help.html).

## 7. Notas de crédito

**Observado:** dos entradas, Crear a partir de factura y Crear nota de crédito. Primera abre selección de factura con filtros; segunda abre editor completo en diálogo. Comparte empresa, cliente, vendedor, direcciones, líneas, impuestos, descuento, envío y notas con documentos comerciales.

Listado: Fecha, Número, Cliente, Vendedor, Importe no aplicado, Total, Estado y Acción. La cuenta observada no tenía notas de crédito.

**Brecha local:** tabla con encabezado y total, sin líneas de crédito, aplicación a documentos ni monto disponible. Se necesita distinguir crédito emitido, aplicado y restante. Aplicar y deshacer aplicaciones están descritos en el [manual de notas de crédito](https://run.briskinvoicing.com/es/help/creditnotes_help.html); no se ejercitaron.

**Aceptación:** crédito desde factura conserva referencia; aplicación parcial no supera saldo disponible ni saldo de factura; deshacer restaura ambos saldos; historial permite reconstruir movimiento; PDF excluye notas privadas.

## 8. Pagos

**Listado observado:** período, fechas, palabra clave. Fecha, Número, Cliente, Método, Factura, Referencia de pago, Importe, Importe no aplicado y Acción.

**Formulario observado:** fecha, cliente, monto total, número generado, método y referencia. Tabla de facturas con vencimiento, total, pendiente e importe aplicado editable. Indicador del restante no aplicado. Botones Aplicar pago, Otro pago y Cancelar.

**Brecha local:** un `payments.invoice_id` no expresa un pago repartido entre varias facturas. Incorporar tabla de aplicaciones. Mantener importe original, suma aplicada y resto disponibles sin confundirlos con estado de envío de la factura.

**Aceptación:** pago de 150 aplicado 100 a factura A y 30 a B deja 20 disponibles; aplicar esos 20 después no crea un segundo ingreso. Rechazar aplicaciones negativas, superiores al pago o a deuda; guardar pago y aplicaciones en una transacción. El recibo, edición y aplicación posterior están descritos en el [manual de pagos](https://run.briskinvoicing.com/es/help/payments_help.html).

## 9. Reembolsos y devoluciones

**Observado:** listado por período, fechas y palabra clave. Fecha, Número, Cliente, Método, Referencia de reembolso, Importe y Acción. Nuevo reembolso pide cliente y presenta Registrar reembolso al cliente, Ajustar facturas y Emitir nota de crédito; botones inicialmente deshabilitados sin cliente válido.

**Brecha local:** solo existe un registro con `payment_id`, monto, motivo y estado. Faltan referencia, método, número propio y reglas de disponibilidad. No tratar emitir crédito como salida de dinero.

**Documentado:** registro de fecha, método, referencia y monto, con opciones posteriores de documento y correo. [Manual de reembolsos](https://run.briskinvoicing.com/es/help/refunds_help.html).

**Aceptación:** devolución no excede fondos/crédito reembolsable; referencia a operación origen; reintentos no duplican salida; devolución y nota de crédito se reflejan como operaciones diferentes; ajuste de factura mantiene historial.

## 10. Artículos e inventario

**Listado observado:** búsqueda por código/descripción; Código, Descripción, Impuesto, Valor, Cantidad, Editar y Borrar.

**Formulario observado:** código, descripción, valor unitario, impuesto, gestionar inventario, cantidad actual, ideal, advertencia, proveedor y nota. Los tres campos de cantidad están deshabilitados mientras no se gestione inventario.

**Brecha local:** alta de SKU, nombre, descripción, precio y unidad; no hay edición, impuesto predeterminado ni inventario. Incorporar movimientos y controles de cantidades, evitando descontar stock solo por abrir o guardar una cotización.

**Aceptación:** artículo seleccionado completa precio/descripción/impuesto del documento; cambio futuro de catálogo no altera documentos emitidos; cantidades opcionales; alerta en umbral; nota interna excluida de salidas. El significado del umbral y la privacidad de la nota se confirman en el [manual de artículos](https://run.briskinvoicing.com/es/help/items_help.html).

## 11. Informes

Catálogo observado de 13 informes en seis grupos:

| Grupo | Informes |
|---|---|
| Cuentas por cobrar | Facturas; Cotizaciones; Cuentas pendientes de pago; Informe de antigüedad |
| Clientes | Clientes; Ventas al cliente; Artículos por cliente |
| Ventas | Vendedor; Ventas de artículos |
| Pagos recibidos | Pagos; Ingresos mensuales |
| Impuestos | Informe de impuestos sobre las ventas |
| Inventario | Informe de inventario de artículos |

Abrir Informe de antigüedad mostró Ver informe, Guardar informe, Guardar como CSV, Enviar PDF y Enviar CSV por correo. No se generaron esos archivos. Los parámetros y columnas de los 13 resultados requieren inspección adicional con datos de prueba.

**Implementación propuesta:** consultas compartidas con listados; rangos y cliente/vendedor cuando correspondan; vista previa; exportación coherente de la misma consulta; política explícita para borradores/anulaciones/reembolsos. Antigüedad necesita intervalos definidos y saldo a fecha de corte, no solamente saldo actual. Inventario a fecha necesita movimientos históricos.

**Aceptación:** totales conciliables con documentos y pagos; mismo resultado en pantalla/PDF/CSV; límites de período inclusive definidos; ningún documento duplicado por uniones con líneas; CSV neutraliza fórmulas de hojas de cálculo.

## 12. Herramientas e importaciones

**Observado:** historial con fecha, nombre de archivo, tipo, filas importadas y acción; opción de deshacer; botón dividido para importar artículos, clientes, facturas, cotizaciones o notas de crédito. Artículos abre carga de archivo y presenta campos de código, descripción, valor, cantidades, impuesto y proveedor.

**Documentado:** CSV, mapeo de columnas, línea de inicio, opción de sobrescribir coincidencias y resultado de importación. [Manual de importación](https://run.briskinvoicing.com/es/help/import_help.html).

**Brecha local:** no hay importador ni historial. Implementar vista previa y validación antes de guardar, resultados por fila, registro de lote y reversión trazable. Deshacer debe respetar documentos creados después; no eliminar referencias usadas por operaciones posteriores.

## 13. Configuración

Las 17 entradas observadas son las siguientes. Algunas comparten ajustes entre tipos de documento.

| Sección | Contenido observado o alcance |
|---|---|
| Empresa | Nombre, registro, dirección, teléfono, fax, web, correo, logo y tamaño/configuración del logo |
| Regional | Símbolo y código de moneda, posición, decimales, separadores, formatos de fecha impresa, de columnas y de entrada |
| Impuestos | Tasas, impuesto predeterminado, precio/subtotal con impuesto, subtotales por tasa, separación de combinados, columna y representación del impuesto |
| Diseño de página | A4/Carta/Legal, márgenes, posiciones de direcciones/empresa y altura del logo |
| Facturas | Visibilidad de columnas, vendedor, envío, vencimiento, marcas pagado/vencido, QR, prefijo/número, XML, campos personalizados, notas, correo, recargos y recordatorios/SMS |
| Plantillas | Galería de numerosos diseños vista en el editor; selección y guardado; diferencias de cada PDF pendientes de comparar |
| Posición de factura | Distribución de título, empresa, datos y logo en cuadrícula; direcciones inferiores |
| Bordes de factura | Bordes, acentos, colores y sombreado alterno de líneas |
| Texto de factura | Etiquetas de encabezados y totales; pestaña de atributos; usar/guardar plantilla de texto |
| Cotizaciones | Títulos de cotización/estimado, prefijo/número, nota pública y al pie, alineación/tamaño |
| Notas de crédito | Títulos, prefijo/número, notas y tipografía |
| Pago | Numeración/recibo, pie, métodos; conexiones Stripe y PayPal presentadas, sin configurarlas |
| Inventario | Advertencia por artículo sin existencias |
| Estado de cuenta | Automatización, próxima fecha, destinatarios todos/vencidos, intervalo, documentos, umbral, textos y pie |
| Vendedor | Listado y Nuevo vendedor |
| Usuario | Nombre/correo/privilegios/acciones, Nuevo usuario y cambio de contraseña; alta bloqueada por plan |
| Suscripciones | Enlace a gestión del plan; contratación y reglas internas no verificadas |

**BBS:** configuración actual solo guarda datos básicos, moneda, prefijo de cotización y vigencia. Ajustes deben tener efecto verificable en editores y salidas; no crear switches que guarden sin cambiar comportamiento. Configuración de suscripción de un producto comercial no necesita copiarse como cobro al personal interno de BBS. Las integraciones de pago, SMS, XML y suscripciones requieren decisiones de proveedor y pruebas propias.

## 14. Ayuda y comunicación

Ayuda muestra acceso a videos, manual y redes de Brisk. La réplica debe ofrecer guías propias de BBS por módulo, con enlaces contextuales desde formularios. Asistencia y sugerencias deben dirigir al responsable de BBS. No reutilizar destinatarios ni canales de Brisk.

## 15. Arquitectura de datos propuesta

Conservar tablas y autorización existentes. Extender mediante migraciones revisables, sin reiniciar base de datos.

| Área | Cambios necesarios |
|---|---|
| Clientes | Grupo, vendedor, activo, envío, condiciones/método, exento, datos impresos y notas separadas |
| Catálogos | Grupos, vendedores, proveedores, impuestos y métodos de pago administrables |
| Artículos | Impuesto, inventario opcional, umbrales, proveedor, nota privada y movimientos |
| Documentos | Instantánea de cliente/direcciones/empresa; notas pública/privada/pie; descuento/envío/impuesto; clase cotización/estimado; orden y campos personalizados |
| Líneas | Cantidad, precio, impuesto y descuento con precisión monetaria definida; descripción histórica |
| Créditos | Líneas y aplicaciones de crédito; relación opcional a factura origen |
| Pagos | Número de recibo y aplicaciones pago–factura de muchos a muchos |
| Reembolsos | Número, fecha, método, referencia y operación origen con trazabilidad |
| Recurrentes | Documento plantilla, programación, ejecución y documento generado; claves para evitar duplicados |
| Importaciones | Lotes, filas, errores, registros afectados y reversión controlada |
| Configuración | Ajustes por sección y plantillas versionadas; trabajos de recordatorios/estados de cuenta |
| Auditoría | Actor, fecha, operación y documento; resultado de envío/generación/importación |

Este diseño es una propuesta para BBS, no una extracción del esquema privado de Brisk.

### Reglas transversales

- Guardar encabezado, líneas, totales y evento en una transacción. Recalcular en servidor; no confiar en totales del navegador.
- Emitir números de forma atómica y única. Desacoplar número visible, ID y secuencia; no usar cantidad de registros + 1.
- Separar estado comercial, estado de envío y estado de cobro. Marcar enviado no implica pagado ni confirma entrega del correo.
- Moneda/fechas con configuración explícita; usar America/Panama para límites de día de BBS. No depender del huso horario del servidor.
- Calcular saldos desde aplicaciones válidas y reversos. La fórmula exacta debe modelar devoluciones, anulaciones y créditos sin contar un mismo ajuste dos veces.
- Conservar instantáneas al emitir. Cambiar un cliente, artículo o plantilla no debe reescribir silenciosamente documentos históricos.
- Reintentos de emisión, cobro y trabajos programados con claves de idempotencia.
- Servidor y políticas de acceso verifican permisos. Proteger APIs PDF/exportación igual que las pantallas.
- Tratar errores de consulta como errores visibles, no como listas vacías. Confirmación antes de borrados; preferir anulación trazable de documentos emitidos.
- Separar datos públicos/privados desde el modelo y comprobar que salidas nunca incorporen notas internas.

## 16. Orden de construcción

| Etapa | Entrega | Dependencias | Condición de cierre |
|---|---|---|---|
| 1 | Sistema visual y navegación, tablas, filtros, modales | Referencia visual | Capturas comparadas; estados activo/vacío/error; teclado |
| 2 | Configuración comercial, clientes, grupos, vendedores, artículos e impuestos | Migraciones y permisos | Alta/edición/búsqueda persistidas; selectores completos |
| 3 | Editor común y cotizaciones/estimados | Etapa 2; guardado atómico existente | Totales, impuestos, descuentos, notas, PDF y paginación coherentes |
| 4 | Facturas y conversión desde cotización | Etapa 3 | Emisión/edición/duplicado/entrega/etiqueta/PDF; origen conservado |
| 5 | Pagos, créditos, reembolsos y estados de cuenta | Etapa 4 | Conciliación de saldos; aplicaciones parciales/reversos; recibos |
| 6 | Panel e informes con exportaciones | Datos comerciales completos | Totales conciliados y archivos verificados |
| 7 | Importador, recurrencia y recordatorios | Modelo y documentos estables | Vista previa/lotes/reintentos y ejecuciones sin duplicados |
| 8 | Ajustes avanzados, ayuda y cierre de paridad | Etapas anteriores | Recorrido completo por módulo y validación visual/documental |

La prioridad evita construir informes o un panel atractivo sobre operaciones financieras todavía incompletas. No representa una estimación de días ni un porcentaje de avance.

## 17. Matriz mínima de aceptación

| Caso | Resultado exigido |
|---|---|
| Cliente con condiciones propias | Editor hereda vendedor, dirección, método y días correctos |
| Cotización con más de ocho líneas | Se conserva completa; PDF pagina sin cortar contenido |
| Cantidades fraccionarias y redondeo | Navegador, servidor, base y PDF coinciden al centavo |
| Descuento fijo/porcentaje/por línea | Se distingue cada modalidad y se aplica impuesto según regla definida |
| Cotización a factura | Cliente, líneas, importes y origen correctos; sin doble emisión por reintento |
| Pago parcial y sobrepago | Saldo correcto y remanente no aplicado recuperable |
| Un pago repartido | Varias aplicaciones; un solo ingreso |
| Crédito parcial y deshacer | Factura y crédito recuperan saldos correctos |
| Reembolso | Se distingue salida de dinero de emisión de crédito |
| Período Hoy/mes/año/personalizado | Rango real correcto y mantenido al paginar/exportar |
| Envío fallido | Error visible y estado sin afirmar envío exitoso |
| Nota privada | Ausente de todos los PDFs, CSV públicos y correos |
| Cambio de catálogo/cliente | Documentos emitidos conservan instantánea |
| Dos usuarios emiten a la vez | Números únicos y sin pérdida de líneas |
| Recurrencia ejecutada dos veces | Solo una factura por ejecución prevista |
| Importación con error | Vista previa y error por fila; transacción/lote recuperable |
| Informe y exportación | Mismos filtros, registros y totales |
| Sesión sin autorización | Sin acceso a registros, PDF, exportaciones ni operaciones |
| Escritorio y móvil | Navegación usable y acciones accesibles; sin solapamientos |

## 18. Estado de esta entrega

Análisis de interfaz y revisión estática del proyecto completados con los límites de verificación señalados. La réplica funcional todavía no está implementada por este documento. No se desplegaron cambios ni se aplicaron migraciones. Los cambios de cotizaciones que ya estaban en el área de trabajo se conservaron.

Para declarar paridad 1 a 1 faltan las implementaciones y pruebas de la matriz, además de inspeccionar resultados PDF/CSV, reportes individuales, programa de recurrencia, pantalla posterior de reembolso, errores y diseño móvil. Este inventario permite construir por módulos sin presentar botones decorativos como funciones terminadas.
