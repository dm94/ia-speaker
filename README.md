# IA Speaker

Una aplicación web para conversaciones por voz con inteligencia artificial que funciona completamente de manera local. Utiliza LM Studio para generación de texto y el modelo sesame/csm-1b para síntesis de voz.

## 🚀 Características

- **Conversación por voz bidireccional** con IA
- **Funcionamiento completamente local** - sin dependencias de servicios en la nube
- **Integración con LM Studio** para generación de texto
- **Síntesis de voz avanzada** usando sesame/csm-1b
- **Interfaz moderna** construida con React y TypeScript
- **Historial de conversaciones** con búsqueda
- **Configuración flexible** de parámetros de IA y audio

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI (para síntesis de voz)
- **IA**: LM Studio (generación de texto) + sesame/csm-1b (síntesis de voz)
- **Audio**: Web Audio API + Web Speech API

## 📋 Requisitos Previos

### Software Necesario
1. **Node.js** (v18 o superior)
2. **Python** (v3.8 o superior)
3. **LM Studio** - [Descargar aquí](https://lmstudio.ai/)
4. **CUDA** (opcional, para aceleración GPU)

### Modelos Requeridos
1. **Modelo de lenguaje** en LM Studio (ej: Llama, Mistral, etc.)
2. **sesame/csm-1b** para síntesis de voz

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd ia-speaker
```

### 2. Instalar Dependencias del Frontend
```bash
pnpm install
# o
npm install
```

### 3. Configurar Backend Python (Síntesis de Voz)

Crea un entorno virtual de Python:
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Instala las dependencias de Python:
```bash
pip install fastapi uvicorn torch transformers datasets
```

### 4. Configurar LM Studio

1. Descarga e instala [LM Studio](https://lmstudio.ai/)
2. Descarga un modelo de lenguaje (recomendado: Llama 3.1 8B o similar)
3. Inicia el servidor local en LM Studio:
   - Ve a la pestaña "Local Server"
   - Selecciona tu modelo
   - Inicia el servidor en `http://localhost:1234`

## 🎯 Uso

### 1. Iniciar el Backend Python

Crea un archivo `backend/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import CsmForConditionalGeneration, AutoProcessor

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar modelo sesame/csm-1b
model_id = "sesame/csm-1b"
device = "cuda" if torch.cuda.is_available() else "cpu"
processor = AutoProcessor.from_pretrained(model_id)
model = CsmForConditionalGeneration.from_pretrained(model_id, device_map=device)

@app.post("/synthesize")
async def synthesize_speech(request: dict):
    text = request.get("text", "")
    
    # Preparar inputs
    inputs = processor(f"[0]{text}", add_special_tokens=True).to(device)
    
    # Generar audio
    audio = model.generate(**inputs, output_audio=True)
    
    # Guardar y retornar audio
    audio_path = "output.wav"
    processor.save_audio(audio, audio_path)
    
    return {"audio_url": f"/audio/{audio_path}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Inicia el backend:
```bash
cd backend
python main.py
```

### 2. Iniciar el Frontend

En otra terminal:
```bash
pnpm dev
# o
npm run dev
```

### 3. Configurar la Aplicación

1. Abre `http://localhost:5173` en tu navegador
2. Ve a la página de **Configuración**
3. Configura:
   - **URL de LM Studio**: `http://localhost:1234`
   - **Modelo**: Nombre del modelo cargado en LM Studio
   - **Parámetros de audio**: Ajusta según tus preferencias

### 4. ¡Comenzar a Conversar!

1. Ve a la **Página Principal**
2. Presiona el botón del micrófono
3. Habla tu pregunta
4. Escucha la respuesta generada

## 📁 Estructura del Proyecto

```
ia-speaker/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── pages/              # Páginas principales
│   │   ├── Home.tsx        # Página de conversación
│   │   ├── Configuration.tsx # Configuración
│   │   └── History.tsx     # Historial
│   ├── types/              # Declaraciones de tipos
│   └── lib/                # Utilidades
├── backend/                # Backend Python (crear)
│   └── main.py            # Servidor FastAPI
├── public/                 # Archivos estáticos
└── README.md              # Este archivo
```

## ⚙️ Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_LM_STUDIO_URL=http://localhost:1234
VITE_BACKEND_URL=http://localhost:8000
```

### Personalización del Modelo de Voz

Puedes ajustar los parámetros del modelo sesame/csm-1b en el backend:
- **Velocidad de habla**
- **Tono de voz**
- **Calidad de audio**

## 🔧 Solución de Problemas

### Error de Micrófono
- Verifica que el navegador tenga permisos de micrófono
- Usa HTTPS en producción para acceso al micrófono

### Error de Conexión con LM Studio
- Asegúrate de que LM Studio esté ejecutándose
- Verifica que el servidor local esté activo en el puerto 1234
- Comprueba la configuración de CORS en LM Studio

### Error de Síntesis de Voz
- Verifica que el backend Python esté ejecutándose
- Asegúrate de tener suficiente memoria RAM/VRAM para el modelo
- Comprueba que las dependencias de Python estén instaladas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Sesame](https://huggingface.co/sesame) por el modelo CSM-1B
- [LM Studio](https://lmstudio.ai/) por la plataforma de modelos locales
- [Hugging Face](https://huggingface.co/) por las herramientas de transformers
