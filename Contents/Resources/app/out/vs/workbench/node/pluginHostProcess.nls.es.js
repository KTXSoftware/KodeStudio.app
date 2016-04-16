/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *---------------------------------------------------------------------------------------------*/
define("vs/workbench/node/pluginHostProcess.nls.es", {
	"vs/base/common/errors": [
		"{0}. Código de error: {1}",
		"Permiso denegado (HTTP {0})",
		"Permiso denegado",
		"{0} (HTTP {1}: {2})",
		"{0} (HTTP {1})",
		"Error de conexión desconocido ({0})",
		"Error de conexión desconocido. Es posible que ya no esté conectado a Internet o que el servidor al que se había conectado esté sin conexión.",
		"{0}:{1}",
		"Se ha producido un error desconocido. Consulte el registro para obtener más detalles.",
		"Se produjo un error del sistema ({0})",
		"Se ha producido un error desconocido. Consulte el registro para obtener más detalles.",
		"{0} ({1} errores en total)",
		"Se ha producido un error desconocido. Consulte el registro para obtener más detalles.",
		"Sin implementar",
		"Argumento no válido: {0}",
		"Argumento no válido",
		"Estado no válido: {0}",
		"Estado no válido",
		"No se pudo cargar un archivo necesario. O bien no está conectado a Internet o el servidor al que se había conectado está sin conexión. Actualice el explorador y vuelva a intentarlo.",
		"No se pudo cargar un archivo requerido. Reinicie la aplicación para intentarlo de nuevo. Detalles: {0}",
	],
	"vs/base/common/json": [
		"Símbolo no válido",
		"Formato de número no válido",
		"Se esperaba el nombre de la propiedad",
		"Se esperaba un valor",
		"Se esperaban dos puntos",
		"Se esperaba un valor",
		"Se esperaba una coma",
		"Se esperaba un valor",
		"Se esperaba una llave de cierre",
		"Se esperaba un valor",
		"Se esperaba una coma",
		"Se esperaba un valor",
		"Se esperaba un corchete de cierre",
		"Se esperaba un valor",
		"Se esperaba el fin del contenido",
	],
	"vs/base/common/keyCodes": [
		"Windows",
		"Control",
		"Mayús",
		"Alt",
		"Cmd",
		"Windows",
		"Ctrl",
		"Mayús",
		"Alt",
		"Cmd",
		"Windows",
	],
	"vs/base/common/severity": [
		"Error",
		"Advertencia",
		"Información",
	],
	"vs/base/node/zip": [
		"{0} no se encontró dentro del archivo zip.",
	],
	"vs/editor/common/config/defaultConfig": [
		"Contenido del editor",
	],
	"vs/editor/common/modes/modesRegistry": [
		"Texto sin formato",
	],
	"vs/editor/common/services/bulkEdit": [
		"Estos archivos han cambiado durante el proceso: {0}",
	],
	"vs/editor/common/services/modeServiceImpl": [
		"Aporta declaraciones de lenguaje.",
		"Identificador del lenguaje.",
		"Alias de nombre para el lenguaje.",
		"Extensiones de archivo asociadas al lenguaje.",
		"Nombres de archivo asociados al lenguaje.",
		"Patrones globales de nombre de archivo asociados al lenguaje.",
		"Tipos MIME asociados al lenguaje.",
		"Expresión regular que coincide con la primera línea de un archivo del lenguaje.",
		"Ruta de acceso relativa a un archivo que contiene opciones de configuración para el lenguaje.",
		"Valor vacío para \"contributes.{0}\"",
		"la propiedad `{0}` es obligatoria y debe ser de tipo \"string\"",
		"la propiedad `{0}` se puede omitir y debe ser de tipo \"string[]\"",
		"la propiedad `{0}` se puede omitir y debe ser de tipo \"string[]\"",
		"la propiedad `{0}` se puede omitir y debe ser de tipo \"string\"",
		"la propiedad `{0}` se puede omitir y debe ser de tipo \"string\"",
		"la propiedad `{0}` se puede omitir y debe ser de tipo \"string[]\"",
		"la propiedad `{0}` se puede omitir y debe ser de tipo \"string[]\"",
		"Elemento \"contributes.{0}\" no válido. Se esperaba una matriz.",
	],
	"vs/editor/contrib/rename/common/rename": [
		"No hay ningún resultado.",
	],
	"vs/platform/extensions/common/abstractExtensionService": [
		"La extensión `{1}` no se pudo activar. Motivo: dependencia `{0}` desconocida.",
		"La extensión `{1}` no se pudo activar. Motivo: La dependencia `{0}` no se pudo activar.",
		"La extensión `{0}` no se pudo activar. Motivo: Más de 10 niveles de dependencias (probablemente sea un bucle de dependencias).",
		"Error al activar la extensión `{0}`: {1}.",
	],
	"vs/platform/extensions/common/extensionsRegistry": [
		"Se obtuvo una descripción vacía de la extensión.",
		"la propiedad `{0}` es obligatoria y debe ser de tipo \"string\"",
		"la propiedad `{0}` es obligatoria y debe ser de tipo \"string\"",
		"la propiedad `{0}` es obligatoria y debe ser de tipo \"string\"",
		"la propiedad `{0}` es obligatoria y debe ser de tipo \"object\"",
		"la propiedad `{0}` es obligatoria y debe ser de tipo \"string\"",
		"la propiedad `{0}` se puede omitir o debe ser de tipo \"string[]\"",
		"la propiedad `{0}` se puede omitir o debe ser de tipo \"string[]\"",
		"las propiedades `{0}` y `{1}` deben especificarse u omitirse conjuntamente",
		"la propiedad `{0}` se puede omitir o debe ser de tipo \"string\"",
		"Se esperaba que \"main\" ({0}) se hubiera incluido en la carpeta de la extensión ({1}). Esto puede hacer que la extensión no sea portátil.",
		"las propiedades `{0}` y `{1}` deben especificarse u omitirse conjuntamente",
		"Nombre para mostrar de la extensión que se usa en la galería de VS Code.",
		"Categorías que usa la galería de VS Code para clasificar la extensión.",
		"Banner usado en VS Code Marketplace.",
		"Color del banner en el encabezado de página de VS Code Marketplace.",
		"Tema de color de la fuente que se usa en el banner.",
		"El publicador de la extensión VS Code.",
		"Eventos de activación de la extensión VS Code.",
		"Dependencias a otras extensiones. El identificador de una extensión siempre es ${publisher}.${name}. Por ejemplo: vscode.csharp.",
		"Script que se ejecuta antes de publicar el paquete como extensión VS Code.",
		"Todas las contribuciones de la extensión VS Code representadas por este paquete.",
	],
	"vs/platform/extensions/node/extensionValidator": [
		"No se pudo analizar el valor {0} de \"engines.vscode\". Por ejemplo, use: ^0.10.0, ^1.2.3, ^0.11.0, ^0.10.x, etc.",
		"La versión indicada en \"engines.vscode\" ({0}) no es suficientemente específica. Para las versiones de vscode anteriores a la 1.0.0, defina como mínimo la versión principal y secundaria deseadas. Por ejemplo: ^0.10.0, 0.10.x, 0.11.0, etc.",
		"La versión indicada en \"engines.vscode\" ({0}) no es suficientemente específica. Para las versiones de vscode posteriores a la 1.0.0, defina como mínimo la versión principal deseada. Por ejemplo: ^1.10.0, 1.10.x, 1.x.x, 2.x.x, etc.",
		"La extensión no es compatible con {0} de Code y requiere: {1}.",
		"La versión de la extensión no es compatible con semver.",
	],
	"vs/platform/jsonschemas/common/jsonContributionRegistry": [
		"Describe un archivo JSON mediante un esquema. Vea json-schema.org para obtener más información.",
		"Un identificador único para el esquema.",
		"El esquema para comprobar el documento ",
		"Un título descriptivo del elemento",
		"Una descripción larga del elemento. Se usa en menús y sugerencias que aparecen al mantener el puntero.",
		"Un valor predeterminado. Lo usan las sugerencias.",
		"Un número que debe dividir de forma exacta el valor actual (es decir, sin resto).",
		"El máximo valor numérico, inclusivo de forma predeterminada.",
		"Hace exclusiva la propiedad maximum.",
		"El valor numérico mínimo, inclusivo de forma predeterminada.",
		"Hace exclusiva la propiedad minimum.",
		"La longitud máxima de una cadena.",
		"La longitud mínima de una cadena.",
		"Una expresión regular con la que hacer coincidir la cadena. No está anclada de forma implícita.",
		"Para matrices, solo cuando los elementos se hayan establecido como una matriz. Si es un esquema, valida los elementos después de los que haya especificado la matriz de elementos. Cuando se establece en \"false\", los elementos adicionales provocarán un error en la validación.",
		"Para matrices. Puede ser un esquema respecto al que validar cada elemento o una matriz de esquemas respecto a la que validar cada elemento por orden (el primer esquema validará al primer elemento, el segundo esquema validará al segundo elemento y así sucesivamente).",
		"El número máximo de elementos que puede haber en una matriz. Inclusivo.",
		"El número mínimo de elementos que puede haber en una matriz. Inclusivo.",
		"Si todos los elementos en la matriz deben ser únicos. El valor predeterminado es false.",
		"El número máximo de propiedades que puede tener un objeto. Inclusivo.",
		"El número mínimo de propiedades que puede tener un objeto. Inclusivo.",
		"Una matriz de cadenas que enumera los nombres de todas las propiedades necesarias para este objeto.",
		"Esquema o valor booleano. Si es un esquema, se usa para validar todas las propiedades sin coincidencias con \"properties\" o \"patternProperties\". Si es false, las propiedades sin este tipo de coincidencias provocarán un error del esquema.",
		"No se usa para validar. Coloque aquí los esquemas secundarios a los que desee hacer referencia en línea con $ref",
		"Mapa de nombres de propiedad para esquemas para cada propiedad.",
		"Mapa de expresiones regulares de nombres de propiedad para hacer coincidir las propiedades de los esquemas.",
		"Mapa de nombres de propiedad para una matriz de nombres de propiedad o un esquema. Una matriz de nombres de propiedad significa que, para que sea válida, la propiedad denominada en la clave va a depender de las propiedades de la matriz que se encuentre en el objeto. Si el valor es un esquema, este se aplica solamente al objeto si la propiedad en la clave existe en el objeto.",
		"El conjunto de valores literales que son válidos",
		"Una cadena de uno de los tipos de esquema básicos (número, entero, nulo, matriz, objeto, booleano, cadena) o una matriz de cadenas que especifica un subconjunto de esos tipos.",
		"Describe el formato que se espera para el valor.",
		"Una matriz de esquemas, todos los cuales deben coincidir.",
		"Una matriz de esquemas, donde al menos uno debe coincidir.",
		"Una matriz de esquemas, de los cuales uno debe coincidir.",
		"Un esquema que no debe tener coincidencias.",
	],
	"vs/platform/message/common/message": [
		"Cerrar",
		"Cancelar",
	],
	"vs/workbench/api/node/extHostMessageService": [
		"Cerrar",
	],
	"vs/workbench/node/extensionHostMain": [
		"Sobrescribiendo la extensión {0} con {1}.",
		"Cargando la extensión de desarrollo en {0}",
		"Sobrescribiendo la extensión {0} con {1}.",
		"La ruta de acceso {0} no apunta a un ejecutor de pruebas de extensión.",
	],
	"vs/workbench/node/extensionPoints": [
		"No se pudo analizar {0}: {1}.",
		"No se puede leer el archivo {0}: {1}.",
		"No se pudo analizar {0}: {1}.",
		"No se puede leer el archivo {0}: {1}.",
		"No se encontró un mensaje para la clave {0}.",
	],
	"vs/workbench/parts/extensions/common/extensions": [
		"Extensiones",
	],
	"vs/workbench/parts/extensions/node/extensionsService": [
		"Extensión no válida: El archivo package.json no es un archivo JSON.",
		"Extensión no válida: El nombre del manifiesto no coincide.",
		"Extensión no válida: El publicador del manifiesto no coincide.",
		"Extensión no válida: La versión del manifiesto no coincide.",
		"Reinicie Code antes de volver a instalar {0}.",
		"Falta información de la galería",
		"No se encontró una versión de {0} compatible con esta versión de Code.",
		"No se encontró la extensión",
	]
});