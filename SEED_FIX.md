# Corrección de Seeds - Documentación

## Problema Original
Los seeds no se ejecutaban correctamente al iniciar el contenedor Docker. El error indicaba:
```
EntityMetadataNotFoundError: No metadata for "CategoryOrmEntity" was found.
```

## Causa Raíz
1. **Scripts no compilados**: Los scripts de TypeScript (`scripts/seed.ts`, `scripts/run-migrations.ts`) no se estaban compilando a JavaScript
2. **Dockerfile incompleto**: El Dockerfile copiaba `./scripts` pero no compilaba los archivos TypeScript
3. **Entrypoint fallando**: El `entrypoint.sh` intentaba ejecutar `dist/scripts/seed.js` que no existía

## Soluciones Implementadas

### 1. Configuración de TypeScript para Scripts
Creado `scripts/tsconfig.json`:
- Extiende la configuración base del proyecto
- Incluye los scripts y el datasource
- Compila todo a `dist/` manteniendo la estructura correcta

### 2. Actualización del Dockerfile
Agregada línea de compilación en el builder stage:
```dockerfile
# Compilar los scripts de TypeScript y datasource
RUN npx tsc --project scripts/tsconfig.json
```

### 3. Simplificación del Script de Seeds
- Utiliza `AppDataSource` existente en lugar de crear una nueva conexión
- Incluye todas las entidades necesarias automáticamente
- Mantiene la misma funcionalidad pero con mejor arquitectura

## Verificación
✅ Los archivos JavaScript se generan correctamente en `dist/scripts/`
✅ Las importaciones son correctas después de la compilación  
✅ El `datasource.js` se compila y está disponible en `dist/`
✅ La imagen Docker se construye exitosamente

## Uso
El contenedor ahora puede ejecutar:
```bash
node dist/scripts/run-migrations.js  # Migraciones
node dist/scripts/seed.js            # Seeds
```

## Archivos Modificados
- `Dockerfile` - Agregada compilación de scripts
- `scripts/seed.ts` - Simplificado para usar AppDataSource
- `scripts/tsconfig.json` - Nueva configuración (creado)