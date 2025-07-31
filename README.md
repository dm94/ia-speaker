# IA Speaker

Una aplicación web React que simula una llamada telefónica con inteligencia artificial de manera completamente local.

## 🎯 Características

- 🎙️ **Conversación por voz**: Interfaz de llamada telefónica con grabación continua
- 🤖 **IA Local**: Integración con LM Studio para generación de texto
- 🔊 **Síntesis de voz**: Compatible con sesame/csm-1b (fallback a Web Speech API)
- 🔒 **Privacidad total**: Todo funciona localmente, sin envío de datos externos
- 📱 **Responsive**: Diseño optimizado para móviles y escritorio
- ⚡ **Detección automática**: Procesamiento automático cuando detecta silencio
- ⚙️ **Configuración visual**: Panel de configuración integrado

## 📋 Requisitos Previos

### Software Necesario

1. **Node.js** (v18 o superior)
2. **LM Studio** instalado y configurado
3. **Navegador moderno** con soporte para Web Audio API

### Configuración de LM Studio

1. Descarga e instala [LM Studio](https://lmstudio.ai/)
2. Descarga un modelo de lenguaje compatible (recomendado: Llama 3.2 1B o similar)
3. Inicia el servidor local en LM Studio:
   - Ve a la pestaña "Local Server"
   - Carga tu modelo preferido
   - Inicia el servidor en `http://localhost:1234`

### Configuración de Sesame CSM-1B (Opcional)

> **Nota**: Actualmente la aplicación usa Web Speech API para síntesis. La integración con sesame/csm-1b está preparada para implementación futura.

Para usar sesame/csm-1b:

1. Clona el repositorio de CSM:
   ```bash
   git clone https://github.com/SesameAILabs/csm.git
   cd csm
   ```

2. Instala las dependencias:
   ```bash
   python3.10 -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Configura el acceso a los modelos:
   ```bash
   export NO_TORCH_COMPILE=1
   huggingface-cli login
   ```

## 🛠️ Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <repository-url>
   cd ia-speaker
   ```

2. **Instala las dependencias**:
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Inicia la aplicación**:
   ```bash
   pnpm dev
   # o
   npm run dev
   ```

4. **Abre tu navegador** en `http://localhost:5173`

## ⚙️ Configuración

### Configuración de la Aplicación

La configuración se encuentra en `src/App.tsx`:

```typescript
const [config] = useState<AppConfig>({
  lmStudioUrl: 'http://localhost:1234',     // URL de LM Studio
  lmStudioModel: 'local-model',             // Nombre del modelo
  silenceThreshold: 10,                     // Umbral de detección de silencio (0-255)
  silenceTimeout: 2000                      // Tiempo de espera en ms
});
```

### Parámetros Ajustables

- **`silenceThreshold`**: Sensibilidad para detectar silencio (menor = más sensible)
- **`silenceTimeout`**: Tiempo de espera antes de procesar el audio
- **`lmStudioUrl`**: URL del servidor de LM Studio
- **`lmStudioModel`**: Identificador del modelo a usar

## 🎯 Uso

1. **Asegúrate de que LM Studio esté ejecutándose** con un modelo cargado
2. **Permite el acceso al micrófono** cuando el navegador lo solicite
3. **Presiona el botón verde** para iniciar la llamada
4. **Habla naturalmente** - la aplicación detectará automáticamente cuando dejes de hablar
5. **Escucha la respuesta** de la IA
6. **Continúa la conversación** - el ciclo se repite automáticamente
7. **Presiona el botón rojo** para finalizar la llamada

## 🔧 Desarrollo

### Estructura del Proyecto

```
src/
├── hooks/
│   └── useAICall.ts          # Hook principal para manejo de llamadas
├── types/
│   └── speech.ts             # Tipos TypeScript para Web Speech API
├── App.tsx                   # Componente principal
├── App.css                   # Estilos personalizados
└── main.tsx                  # Punto de entrada
```

### Scripts Disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Construye la aplicación para producción
- `pnpm preview` - Previsualiza la build de producción
- `pnpm lint` - Ejecuta el linter

### Tecnologías Utilizadas

- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **RecordRTC** para grabación de audio
- **Axios** para comunicación HTTP
- **WaveSurfer.js** para visualización de audio

## 🚨 Solución de Problemas

### Error de Micrófono
- Asegúrate de permitir el acceso al micrófono en tu navegador
- Verifica que no haya otras aplicaciones usando el micrófono
- Prueba en una pestaña de incógnito para descartar extensiones

### Error de Conexión con LM Studio
- Verifica que LM Studio esté ejecutándose en `http://localhost:1234`
- Asegúrate de que el modelo esté cargado y el servidor iniciado
- Revisa la configuración de CORS en LM Studio si es necesario

### Problemas de Audio
- Verifica que tu navegador soporte Web Audio API
- Ajusta los parámetros de `silenceThreshold` y `silenceTimeout`
- Prueba con diferentes niveles de volumen del micrófono

## 🔮 Roadmap

- [ ] Integración completa con sesame/csm-1b
- [ ] Configuración de parámetros desde la UI
- [ ] Soporte para múltiples idiomas
- [ ] Mejoras en la detección de voz
- [ ] Modo de transcripción en tiempo real
- [ ] Temas personalizables

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## ⚠️ Consideraciones de Privacidad

Esta aplicación está diseñada para funcionar completamente en local:

- **No se envían datos a servidores externos**
- **Todo el procesamiento ocurre en tu máquina**
- **LM Studio ejecuta modelos localmente**
- **El audio nunca sale de tu dispositivo** (excepto para procesamiento local)

## 📞 Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa la sección de solución de problemas
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

---

**¡Disfruta conversando con tu IA local! 🎉**