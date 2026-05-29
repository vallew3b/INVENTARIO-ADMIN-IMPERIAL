// Manejar la ruta de módulos cuando está empaquetado
const path = require('path');
const fs = require('fs');

let createClient;

try {
  // Intentar cargar normalmente (desarrollo)
  const supabaseModule = require('@supabase/supabase-js');
  createClient = supabaseModule.createClient;
} catch (e) {
  // Si falla, buscar en app.asar.unpacked (producción)
  let supabasePath = null;
  
  // Buscar en diferentes ubicaciones posibles
  const possiblePaths = [
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', '@supabase', 'supabase-js'),
    path.join(__dirname, '..', 'app.asar.unpacked', 'node_modules', '@supabase', 'supabase-js'),
    path.join(process.execPath, '..', 'resources', 'app.asar.unpacked', 'node_modules', '@supabase', 'supabase-js'),
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      supabasePath = possiblePath;
      break;
    }
  }
  
  if (supabasePath) {
    const supabaseModule = require(supabasePath);
    createClient = supabaseModule.createClient;
  } else {
    throw new Error('No se pudo encontrar @supabase/supabase-js. Rutas buscadas: ' + possiblePaths.join(', '));
  }
}

const supabaseUrl = 'https://qlinfgsqpzyhioqygevv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaW5mZ3NxcHp5aGlvcXlnZXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTY1NzcsImV4cCI6MjA5MjczMjU3N30.4AitjCtqVVNur8AV7FoA7Dp1mPoln8Ceazm4gpdJxT0';

let supabaseServiceKey = '';
try {
  const secretsPath = path.join(__dirname, 'secrets.json');
  if (fs.existsSync(secretsPath)) {
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    supabaseServiceKey = secrets.supabaseServiceKey;
  }
} catch (err) {
  console.error('Error al cargar secrets.json:', err);
}

// Cliente para el proceso principal (usa service key para operaciones administrativas)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cliente para el renderer (usa anon key con cabecera de seguridad)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-app-secret': 'UrbanStoreImperio2026SecretKey!'
    }
  }
});

module.exports = { supabase, supabaseAnon, supabaseUrl };

