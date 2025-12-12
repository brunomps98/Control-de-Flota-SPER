// Importamos las dependencias necesarias
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configuramos dotenv para leer las variables de entorno desde el archivo .env
dotenv.config();

// Introducimos las variables con la URL de la base de datos y la clave desde el archivo .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Si no son correctas arrojamos error
if (!supabaseUrl || !supabaseKey) {
    console.error(' Error: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY, por favor agregarlas.');
    process.exit(1);
}

// Las exportamos y creamos el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);