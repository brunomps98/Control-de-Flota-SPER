// Importamos dirname para poder extraer la carpeta de una ruta de archivo
import {dirname} from "path"
// Importamos fileURLToPath para convertir una URL a una ruta de texto normal
import { fileURLToPath } from "url"
// Obtiene la url del archivo, la convierte a ruta de sistema y se queda solo con la carpeta
export const __dirname=dirname(fileURLToPath(import.meta.url))
