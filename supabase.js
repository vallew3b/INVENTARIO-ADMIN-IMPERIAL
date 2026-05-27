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

const supabaseUrl = 'https://pyuqebokjhtwyrojwgxd.supabase.co';
const supabaseAnonKey = 'sb_publishable_IUyaOWBuDvTAURD92VCxQQ_AGQN1-pw';

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

// Cliente para el renderer (usa anon key)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase, supabaseAnon, supabaseUrl };

