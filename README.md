# Restaurant MARY CRM - Aplicación Web

Esta es la versión final y profesional de la aplicación. Utiliza un sistema de compilación moderno (Vite) para garantizar el rendimiento y la compatibilidad.

## Cómo Publicar la Aplicación (Método Definitivo)

Este nuevo sistema utiliza una automatización (GitHub Actions) que compila y publica la aplicación por ti.

### Paso 1: Configurar el Repositorio

1.  **Sube todos los archivos** de esta nueva estructura a un repositorio nuevo y público en GitHub.
2.  **IMPORTANTE:** Abre el archivo `vite.config.ts`. Verás una línea que dice `base: "/<REPOSITORY_NAME>/"`. Debes reemplazar `<REPOSITORY_NAME>` con el nombre exacto de tu repositorio de GitHub. Por ejemplo, si tu repositorio se llama `app-restaurante`, la línea debe ser `base: "/app-restaurante/"`. Guarda y sube este cambio (`commit`).

### Paso 2: Activar GitHub Actions y Pages

1.  En la página de tu repositorio en GitHub, ve a la pestaña **"Actions"**. Si te pide habilitar los workflows, haz clic en el botón verde para confirmarlo.
2.  Ahora ve a la pestaña **"Settings"** ⚙️ > **"Pages"**.
3.  En la sección "Build and deployment", bajo "Source", selecciona **"GitHub Actions"**.

### Paso 3: ¡Listo!

¡Eso es todo! Ahora, cada vez que subas un cambio a tu rama `main`, el robot de GitHub Actions se activará, compilará tu aplicación y la publicará automáticamente.

- Puedes ver el progreso en la pestaña "Actions".
- Después del primer despliegue (que puede tardar unos 3-5 minutos), el enlace a tu aplicación aparecerá en la sección "Settings" > "Pages".

Este es el método profesional y robusto que usan los desarrolladores para asegurar que todo funcione siempre a la perfección.