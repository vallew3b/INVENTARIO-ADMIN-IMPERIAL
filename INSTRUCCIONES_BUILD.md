# Instrucciones para Reconstruir el Ejecutable

## Si el build falla porque el archivo está en uso:

1. **Cierra TODAS las ventanas de la aplicación** que estén abiertas
2. **Cierra Cursor/VS Code** si está abierto
3. **Abre el Administrador de Tareas** (Ctrl + Shift + Esc)
4. **Busca y cierra** cualquier proceso relacionado con:
   - "Sistema de Inventario"
   - "electron"
   - "node"
5. **Elimina manualmente la carpeta `dist`** si existe
6. **Ejecuta el build de nuevo:**
   ```bash
   npm run build-win
   ```

## El ejecutable estará en:
```
dist\Sistema de Inventario Setup 1.0.0.exe
```

## Solución Manual (si el ejecutable sigue dando error):

Si después de instalar el ejecutable sigue dando el error de `@supabase/supabase-js`, puedes copiar manualmente las dependencias:

1. Ve a: `C:\Program Files\Sistema de Inventario\resources\`
2. Verifica que exista: `app.asar.unpacked\node_modules\@supabase\`
3. Si NO existe, copia la carpeta `node_modules\@supabase\` desde tu proyecto de desarrollo a esa ubicación




