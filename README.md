# API REST de Gestión de Pacientes - Node.js/Express

## Requisitos

- Node.js 18+ (LTS recomendado)
- npm 9+ o yarn
- Oracle Database 11g+

## Instalación

1. Usar Node.js 18 

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear archivo `.env` con las siguientes credenciales:
```
PORT=3000
DB_HOST=localhost
DB_PORT=1521
DB_SID=XE
DB_USER=system
DB_PASSWORD=Oracle123
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars-here
JWT_EXPIRES_IN=24h
```

4. Ejecutar scripts SQL para crear tablas:
Los scripts se encuentran en `scripts/create-schema.sql`

## Ejecución

Modo desarrollo:
```bash
npm run dev
```

Modo producción:
```bash
npm start
```

El servidor se ejecutará en: `http://localhost:3000`

## Endpoints

### Autenticación

**POST /autenticacion/login**
- Body: `{ "usuario": "VERIS", "clave": "PRUEBAS123" }`
- Retorna: Bearer token

### Pacientes

**POST /pacientes** (Requiere autenticación)
- Crear nuevo paciente

**PUT /pacientes/:idPaciente** (Requiere autenticación)
- Modificar paciente existente

**DELETE /pacientes/:idPaciente** (Requiere autenticación)
- Inactivar paciente lógicamente

**GET /pacientes/:idPaciente** (Requiere autenticación)
- Obtener paciente por ID

**GET /pacientes** (Requiere autenticación)
- Buscar pacientes con filtros opcionales
- Query params: `numeroIdentificacion`, `nombreCompleto`, `email`, `estado`, `page`, `pageSize`

### Health Check

**GET /health**
- Verificar que la API está funcionando

## Estructura de Respuesta

Todas las respuestas siguen el formato:
```json
{
  "status": true/false,
  "data": {},
  "message": "Mensaje descriptivo",
  "errors": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

Imagenes de prueba
<img width="1142" height="631" alt="image" src="https://github.com/user-attachments/assets/1bb543be-dd60-4150-9559-51323b3be378" />
<img width="1151" height="624" alt="image" src="https://github.com/user-attachments/assets/9a0c4be5-1841-400f-99a7-031258d49084" />
<img width="1152" height="624" alt="image" src="https://github.com/user-attachments/assets/cfa7c8bc-743b-4567-95e2-5499700ab06d" />


