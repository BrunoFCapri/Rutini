# 🌌 Chaja Mesh: Productivity Suite

Una infraestructura de productividad integral, multiplataforma y de alto rendimiento desarrollada desde cero. Este ecosistema reemplaza la dependencia de servicios de terceros (Google Calendar, Notion, Google Tasks) mediante una arquitectura de microservicios soberana, diseñada para la eficiencia extrema en hardware local (**Raspberry Pi 5 / CapiOS**).

---

## 🎯 Core Features & Multi-Platform

* **📅 Calendar Engine (Rust):** Implementación nativa de lógica de eventos y recurrencias (RFC 5545) con sistema de notificaciones push asíncronas.
* **📝 Block-Based Notes (Rust):** Motor de notas estilo Notion con soporte para tipos de datos complejos y persistencia en tiempo real.
* **✅ Task Orchestrator (Rust):** Gestión de tareas con prioridades, estados de ciclo de vida y sincronización multi-dispositivo.
* **📱 Mobile App (React Native):** Aplicación móvil nativa con notificaciones de eventos en tiempo real y modo offline.
* **💻 Desktop Client (Tauri/Rust):** Cliente de escritorio ultra-ligero que aprovecha el backend en Rust para un consumo mínimo de recursos.
* **📟 Terminal UI - Lite Version (Rust/TUI):** Versión de terminal optimizada para **CapiOS**. Diseñada para consumir el mínimo de energía y CPU, ideal para gestión rápida vía SSH o local.
* **🐳 Infra-Controller (Go):** Gestor de infraestructura que interactúa con el Docker SDK para el despliegue automático y monitoreo de salud de los servicios.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Rol / Implementación |
| :--- | :--- | :--- |
| **Backend Core** | **Rust** (Axum/Tokio) | Lógica de negocio con seguridad de memoria y alta concurrencia. |
| **Orquestación** | **Go** | Scripts de gestión para Docker Engine y automatización de la infra. |
| **Mobile App** | **React Native** | Interfaz móvil multiplataforma con integración de notificaciones push. |
| **Desktop / TUI** | **Tauri / Ratatui** | Clientes livianos enfocados en performance y bajo consumo. |
| **Database** | PostgreSQL | Persistencia relacional robusta para datos estructurados. |
| **Cache** | Redis | Gestión de sesiones y colas de tareas rápidas. |
| **Runtime** | Docker / Debian | Aislamiento de servicios en arquitectura ARM64 (**CapiOS**). |

---

## 🏗️ Arquitectura del Sistema

```text
[ Mobile App ] <───┐          [ Desktop / TUI ]
                   │                 │
                   ▼                 ▼
        [ Reverse Proxy: Nginx/Traefik ]
                   │
       ├─► [ Service: Notes & Calendar (Rust) ] ──► [ PostgreSQL ]
       │
       ├─► [ Infra-Controller (Go) ] ────────────► [ Docker SDK ]
       │
       └─► [ Auth & Session (Redis) ]
```

---

## 🚀 Getting Started

Este proyecto consta de 3 partes principales:
1. **Infraestructura**: Base de datos (PostgreSQL) y Caché (Redis) corriendo en Docker.
2. **Backend**: API escrita en Rust (Axum).
3. **Web**: Frontend escrito en React + TypeScript.

### 📋 Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js & npm](https://nodejs.org/)

### 🛠️ Instrucciones de Ejecución

#### 1. Iniciar Infraestructura (Postgres & Redis)
Ejecuta esto en la raíz del proyecto para levantar la base de datos y cache:

```bash
docker-compose up -d
```

#### 2. Iniciar Backend (Rust)
Abre una nueva terminal:

```bash
cd backend
cargo run
```

El servidor estará corriendo en `http://localhost:3000`.

#### 3. Iniciar Frontend Web (React)
Abre otra terminal:

```bash
cd web
npm install
npm run dev
```

La web estará disponible en `http://localhost:5173`.

### 🧪 Verificar Conexión
Una vez que todo esté corriendo, abre la web. Deberías ver el estado "Connected" para Database y Redis en el panel de control.

## 🏗️ Estructura del Proyecto

- `backend/`: Código fuente del servidor Rust.
- `web/`: Código fuente del cliente web React.
- `docker-compose.yml`: Definición de servicios de infraestructura.
