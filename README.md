# 🐄 GanaderoApp

> Sistema integral de gestión ganadera con caravanas electrónicas RFID | Cumplimiento normativo SENASA Argentina

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 📋 Índice

- [¿Qué es GanaderoApp?](#-qué-es-ganaderoapp)
- [Características](#-características)
- [Demo Rápido](#-demo-rápido)
- [Instalación](#-instalación)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Estructura actual del proyecto](#-estructura-actual-del-proyecto)
- [Documentación](#-documentación)
- [Roadmap](#️-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 🎯 ¿Qué es GanaderoApp?

**GanaderoApp** transforma la obligación legal de usar caravanas electrónicas en una poderosa herramienta de gestión ganadera.

En Argentina, la normativa SENASA exige el uso de caravanas electrónicas RFID en todo el ganado, pero la mayoría de los productores solo las usan para cumplir la ley sin obtener ningún valor agregado. 

**Nosotros cambiamos eso.**

Con solo escanear la caravana, el productor accede instantáneamente a:
- 📊 Historial completo del animal
- ⚖️ Pesajes y ganancia diaria automática
- 💉 Recordatorios de tratamientos veterinarios
- 📈 Análisis y reportes en tiempo real
- 📱 Todo desde el celular, incluso sin internet

---

## ✨ Características

### 📱 App Móvil (React Native)
- ✅ Escaneo de caravanas RFID con bastón Bluetooth
- ✅ Vista instantánea de datos del animal
- ✅ Registro de pesajes en campo
- ✅ Cálculo automático de ganancia diaria (GDPV)
- ✅ Historial completo de tratamientos
- ✅ Modo offline con sincronización automática
- ✅ Compatible con iOS y Android

### 💻 Dashboard Web (React)
- ✅ Panel de control con estadísticas en vivo
- ✅ Gráficos de evolución de peso
- ✅ Gestión completa del rodeo
- ✅ Alertas de tratamientos próximos
- ✅ Exportación de reportes (próximamente)
- ✅ Multi-usuario y multi-establecimiento

### 🔧 Backend API (Node.js + Express)
- ✅ API REST completa y documentada
- ✅ Autenticación segura con JWT
- ✅ Base de datos relacional (SQLite/PostgreSQL)
- ✅ Endpoints para animales, pesajes, tratamientos
- ✅ Dashboard con estadísticas agregadas
- ✅ Preparado para escalar

---

## 🚀 Demo Rápido

### Opción 1: Script Automático (Linux/Mac)

```bash
git clone https://github.com/jota1308/ganaderiaAPP.git
cd ganaderiaAPP
./start.sh
```

### Opción 2: Manual (Windows/Linux/Mac)

**Terminal 1 - Backend:**
```bash
npm install
node server.js
```

**Terminal 2 - Dashboard Web:**
```bash
npx http-server . -p 8080
```

**Abre tu navegador en:** `http://localhost:8080`

### 🔑 Credenciales Demo

```
Email:    demo@campo.com
Password: demo123
```

El sistema incluye datos de prueba pre-cargados:
- 3 animales registrados
- Historial de pesajes
- Tratamientos programados

---

## 📦 Instalación

### Requisitos Previos

- **Node.js** v18 o superior ([Descargar](https://nodejs.org))
- **npm** v9 o superior (incluido con Node.js)
- **Git** ([Descargar](https://git-scm.com))

### Clonar el Repositorio

```bash
git clone https://github.com/jota1308/ganaderiaAPP.git
cd ganaderiaAPP
```

### Backend

```bash
npm install
npm start
```

El backend estará corriendo en `http://localhost:3001`

### Dashboard Web

```bash
# Desde la raíz del repo
# Opción 1: Usar http-server (recomendado)
npx http-server . -p 8080

# Opción 2: Abrir directamente
# Doble clic en index.html
```

El dashboard estará disponible en `http://localhost:8080`

### App Móvil (React Native)

```bash
Archivo base disponible en la raíz: `App.js`

# Para correr React Native, inicializá un proyecto RN y copiá App.js
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

**Nota:** Requiere entorno de desarrollo React Native configurado. Ver [guía oficial](https://reactnative.dev/docs/environment-setup).

---

## 🛠️ Tecnologías

### Frontend
- **React** 18 - Dashboard web
- **React Native** - App móvil multiplataforma
- **Chart.js** - Gráficos y visualizaciones

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **SQLite** - Base de datos (desarrollo)
- **PostgreSQL** - Base de datos (producción)
- **JWT** - Autenticación
- **bcrypt** - Encriptación de passwords

### Hardware
- **RFID ISO 11784/11785** - Estándar de caravanas SENASA
- **Bluetooth Low Energy** - Comunicación con bastones lectores
- Compatible con: Allflex, Agrident, Shearwell

---

## 📁 Estructura del Proyecto

```
ganaderiaAPP/
├── server.js               # API backend (Node + Express)
├── package.json            # Dependencias/scripts del backend
├── index.html              # Dashboard web estático
├── App.js                  # App móvil (React Native)
├── backend/
│   └── data/               # Persistencia SQLite compartida
├── start.sh                # Script de inicio local
├── docker-compose.yml      # Orquestación de servicios
└── *.md                    # Documentación del proyecto
```

---

## 🗂️ Estructura actual del proyecto

**Estructura oficial acordada:** **raíz única** (no monorepo con `backend/` y `web/` como código fuente).

- El backend se ejecuta desde la raíz (`server.js` + `package.json`).
- El frontend web también vive en raíz (`index.html`) y se sirve estático.
- La persistencia SQLite se mantiene en `backend/data/`.
- `start.sh` y `docker-compose.yml` ya usan estas rutas reales.

Comandos ejecutables tal cual:

```bash
# Backend (desde la raíz del repo)
npm install
npm start

# Frontend web (desde la raíz del repo)
npx http-server . -p 8080
```

## 📚 Documentación

- **[API Documentation](API_DOCS.md)** - Endpoints, request/response, ejemplos
- **[Integración RFID Bluetooth](INTEGRACION_RFID.md)** - Conectar bastones lectores
- **[Plan Comercial](PLAN_COMERCIAL.md)** - Modelo de negocio y estrategia
- **[Tutorial Visual](TUTORIAL_VISUAL.md)** - Guía paso a paso con capturas

---

## 🗺️ Roadmap

### ✅ Fase 1 - MVP (Completado)
- [x] Backend API funcional
- [x] Dashboard web responsive
- [x] App móvil básica
- [x] Sistema de autenticación
- [x] Gestión de animales y pesajes
- [x] Tratamientos y alertas
- [x] Demo con datos de prueba

### 🏗️ Fase 2 - Producción (En Progreso)
- [ ] Integración Bluetooth RFID real
- [ ] Modo offline robusto
- [ ] Migración a PostgreSQL
- [ ] Deploy en servidor cloud
- [ ] Tests automatizados (Jest)
- [ ] CI/CD con GitHub Actions

### 🚀 Fase 3 - Características Avanzadas
- [ ] Fotos de animales
- [ ] Geolocalización y mapas de potreros
- [ ] Exportación a formatos SENASA
- [ ] Análisis predictivo con IA
- [ ] Alertas por WhatsApp/SMS
- [ ] Integración con balanzas electrónicas

### 🌎 Fase 4 - Escalabilidad
- [ ] Multi-establecimiento
- [ ] Sistema de roles (admin, peones, veterinarios)
- [ ] API pública para integraciones
- [ ] App web progresiva (PWA)
- [ ] Expansión regional (Uruguay, Paraguay)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este es un proyecto open source.

### Cómo Contribuir

1. **Fork** el proyecto
2. Crea tu **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: nueva característica increíble'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formato, sin cambios de código
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Mantenimiento

### Código de Conducta

Este proyecto adhiere al [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Al participar, se espera que cumplas con este código.

---

## 💰 Oportunidad de Inversión

**GanaderoApp está buscando inversión seed de $100K USD** para:

- ✅ Integración completa con hardware RFID
- ✅ Equipo de desarrollo (3 desarrolladores)
- ✅ Marketing y adquisición de clientes
- ✅ Infraestructura cloud y escalabilidad

### Mercado Objetivo

- **150,000+** productores ganaderos en Argentina
- **54 millones** de cabezas de ganado
- **Obligatoriedad legal** de caravanas electrónicas desde 2025
- **Mercado direccionable:** $50M USD/año

### Tracción

- ✅ MVP funcional completo
- ✅ 10 productores piloto en evaluación
- ✅ Feedback positivo del sector
- ✅ Compatible con normativa SENASA

### Proyección Financiera

- **Año 1:** 200 clientes, $75K USD ARR
- **Año 2:** 800 clientes, $216K USD ARR
- **Año 3:** 2,500 clientes, $675K USD ARR

**[Ver Plan de Negocios Completo](PLAN_COMERCIAL.md)**

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2025 GanaderoApp

Se concede permiso, de forma gratuita, a cualquier persona que obtenga una copia
de este software y archivos de documentación asociados (el "Software"), para
usar el Software sin restricción, incluyendo sin limitación los derechos de
usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar, y/o
vender copias del Software...
```

---

## 📞 Contacto

### Desarrollador Principal
- **GitHub:** [@jota1308](https://github.com/jota1308)
- **Email:** *(próximamente)*
- **LinkedIn:***(próximamente)*

### Para Consultas

- 💼 **Inversores:** *(próximamente)*
- 🤝 **Partnerships:** *(próximamente)*
- 🐛 **Bugs/Issues:** [GitHub Issues](https://github.com/jota1308/ganaderiaAPP/issues)
- 💡 **Feature Requests:** [GitHub Discussions](https://github.com/jota1308/ganaderiaAPP/discussions)

### Links

- 🌐 **Website:** www.ganaderoapp.com *(próximamente)*
- 📱 **Demo Online:** *(próximamente)*
- 📖 **Documentación:** [Docs](docs/)
- 📺 **Video Demo:** *(próximamente)*

---

## 🙏 Agradecimientos

- Comunidad de productores ganaderos argentinos por el feedback
- Desarrolladores open source de Node.js, React y React Native
- SENASA por la normativa que hizo posible este proyecto
- Todos los contribuidores y testers beta

---

## ⭐ Dale una Estrella

Si este proyecto te resulta útil, ¡no olvides darle una ⭐ en GitHub!

Ayuda a que más productores ganaderos descubran esta herramienta.

---

<div align="center">

**Hecho con ❤️ para el sector ganadero argentino**

[Reportar Bug](https://github.com/jota1308/ganaderiaAPP/issues) · 
[Solicitar Feature](https://github.com/jota1308/ganaderiaAPP/issues) · 
[Documentación](docs/)

</div># 🐄 GanaderoApp

> Sistema integral de gestión ganadera con caravanas electrónicas RFID | Cumplimiento normativo SENASA Argentina

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 📋 Índice

- [¿Qué es GanaderoApp?](#-qué-es-ganaderoapp)
- [Características](#-características)
- [Demo Rápido](#-demo-rápido)
- [Instalación](#-instalación)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Estructura actual del proyecto](#-estructura-actual-del-proyecto)
- [Documentación](#-documentación)
- [Roadmap](#️-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 🎯 ¿Qué es GanaderoApp?

**GanaderoApp** transforma la obligación legal de usar caravanas electrónicas en una poderosa herramienta de gestión ganadera.

En Argentina, la normativa SENASA exige el uso de caravanas electrónicas RFID en todo el ganado, pero la mayoría de los productores solo las usan para cumplir la ley sin obtener ningún valor agregado. 

**Nosotros cambiamos eso.**

Con solo escanear la caravana, el productor accede instantáneamente a:
- 📊 Historial completo del animal
- ⚖️ Pesajes y ganancia diaria automática
- 💉 Recordatorios de tratamientos veterinarios
- 📈 Análisis y reportes en tiempo real
- 📱 Todo desde el celular, incluso sin internet

---

## ✨ Características

### 📱 App Móvil (React Native)
- ✅ Escaneo de caravanas RFID con bastón Bluetooth
- ✅ Vista instantánea de datos del animal
- ✅ Registro de pesajes en campo
- ✅ Cálculo automático de ganancia diaria (GDPV)
- ✅ Historial completo de tratamientos
- ✅ Modo offline con sincronización automática
- ✅ Compatible con iOS y Android

### 💻 Dashboard Web (React)
- ✅ Panel de control con estadísticas en vivo
- ✅ Gráficos de evolución de peso
- ✅ Gestión completa del rodeo
- ✅ Alertas de tratamientos próximos
- ✅ Exportación de reportes (próximamente)
- ✅ Multi-usuario y multi-establecimiento

### 🔧 Backend API (Node.js + Express)
- ✅ API REST completa y documentada
- ✅ Autenticación segura con JWT
- ✅ Base de datos relacional (SQLite/PostgreSQL)
- ✅ Endpoints para animales, pesajes, tratamientos
- ✅ Dashboard con estadísticas agregadas
- ✅ Preparado para escalar

---

## 🚀 Demo Rápido

### Opción 1: Script Automático (Linux/Mac)

```bash
git clone https://github.com/jota1308/ganaderiaAPP.git
cd ganaderiaAPP
./start.sh
```

### Opción 2: Manual (Windows/Linux/Mac)

**Terminal 1 - Backend:**
```bash
npm install
node server.js
```

**Terminal 2 - Dashboard Web:**
```bash
npx http-server . -p 8080
```

**Abre tu navegador en:** `http://localhost:8080`

### 🔑 Credenciales Demo

```
Email:    demo@campo.com
Password: demo123
```

El sistema incluye datos de prueba pre-cargados:
- 3 animales registrados
- Historial de pesajes
- Tratamientos programados

---

## 📦 Instalación

### Requisitos Previos

- **Node.js** v18 o superior ([Descargar](https://nodejs.org))
- **npm** v9 o superior (incluido con Node.js)
- **Git** ([Descargar](https://git-scm.com))

### Clonar el Repositorio

```bash
git clone https://github.com/jota1308/ganaderiaAPP.git
cd ganaderiaAPP
```

### Backend

```bash
npm install
npm start
```

El backend estará corriendo en `http://localhost:3001`

### Dashboard Web

```bash
# Desde la raíz del repo
# Opción 1: Usar http-server (recomendado)
npx http-server . -p 8080

# Opción 2: Abrir directamente
# Doble clic en index.html
```

El dashboard estará disponible en `http://localhost:8080`

### App Móvil (React Native)

```bash
Archivo base disponible en la raíz: `App.js`

# Para correr React Native, inicializá un proyecto RN y copiá App.js
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

**Nota:** Requiere entorno de desarrollo React Native configurado. Ver [guía oficial](https://reactnative.dev/docs/environment-setup).

---

## 🛠️ Tecnologías

### Frontend
- **React** 18 - Dashboard web
- **React Native** - App móvil multiplataforma
- **Chart.js** - Gráficos y visualizaciones

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **SQLite** - Base de datos (desarrollo)
- **PostgreSQL** - Base de datos (producción)
- **JWT** - Autenticación
- **bcrypt** - Encriptación de passwords

### Hardware
- **RFID ISO 11784/11785** - Estándar de caravanas SENASA
- **Bluetooth Low Energy** - Comunicación con bastones lectores
- Compatible con: Allflex, Agrident, Shearwell

---

## 📁 Estructura del Proyecto

```
ganaderiaAPP/
├── server.js               # API backend (Node + Express)
├── package.json            # Dependencias/scripts del backend
├── index.html              # Dashboard web estático
├── App.js                  # App móvil (React Native)
├── backend/
│   └── data/               # Persistencia SQLite compartida
├── start.sh                # Script de inicio local
├── docker-compose.yml      # Orquestación de servicios
└── *.md                    # Documentación del proyecto
```

---

## 🗂️ Estructura actual del proyecto

**Estructura oficial acordada:** **raíz única** (no monorepo con `backend/` y `web/` como código fuente).

- El backend se ejecuta desde la raíz (`server.js` + `package.json`).
- El frontend web también vive en raíz (`index.html`) y se sirve estático.
- La persistencia SQLite se mantiene en `backend/data/`.
- `start.sh` y `docker-compose.yml` ya usan estas rutas reales.

Comandos ejecutables tal cual:

```bash
# Backend (desde la raíz del repo)
npm install
npm start

# Frontend web (desde la raíz del repo)
npx http-server . -p 8080
```

## 📚 Documentación

- **[API Documentation](API_DOCS.md)** - Endpoints, request/response, ejemplos
- **[Integración RFID Bluetooth](INTEGRACION_RFID.md)** - Conectar bastones lectores
- **[Plan Comercial](PLAN_COMERCIAL.md)** - Modelo de negocio y estrategia
- **[Tutorial Visual](TUTORIAL_VISUAL.md)** - Guía paso a paso con capturas

---

## 🗺️ Roadmap

### ✅ Fase 1 - MVP (Completado)
- [x] Backend API funcional
- [x] Dashboard web responsive
- [x] App móvil básica
- [x] Sistema de autenticación
- [x] Gestión de animales y pesajes
- [x] Tratamientos y alertas
- [x] Demo con datos de prueba

### 🏗️ Fase 2 - Producción (En Progreso)
- [ ] Integración Bluetooth RFID real
- [ ] Modo offline robusto
- [ ] Migración a PostgreSQL
- [ ] Deploy en servidor cloud
- [ ] Tests automatizados (Jest)
- [ ] CI/CD con GitHub Actions

### 🚀 Fase 3 - Características Avanzadas
- [ ] Fotos de animales
- [ ] Geolocalización y mapas de potreros
- [ ] Exportación a formatos SENASA
- [ ] Análisis predictivo con IA
- [ ] Alertas por WhatsApp/SMS
- [ ] Integración con balanzas electrónicas

### 🌎 Fase 4 - Escalabilidad
- [ ] Multi-establecimiento
- [ ] Sistema de roles (admin, peones, veterinarios)
- [ ] API pública para integraciones
- [ ] App web progresiva (PWA)
- [ ] Expansión regional (Uruguay, Paraguay)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este es un proyecto open source.

### Cómo Contribuir

1. **Fork** el proyecto
2. Crea tu **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: nueva característica increíble'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formato, sin cambios de código
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Mantenimiento

### Código de Conducta

Este proyecto adhiere al [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Al participar, se espera que cumplas con este código.

---

## 💰 Oportunidad de Inversión

**GanaderoApp está buscando inversión seed de $100K USD** para:

- ✅ Integración completa con hardware RFID
- ✅ Equipo de desarrollo (3 desarrolladores)
- ✅ Marketing y adquisición de clientes
- ✅ Infraestructura cloud y escalabilidad

### Mercado Objetivo

- **150,000+** productores ganaderos en Argentina
- **54 millones** de cabezas de ganado
- **Obligatoriedad legal** de caravanas electrónicas desde 2025
- **Mercado direccionable:** $50M USD/año

### Tracción

- ✅ MVP funcional completo
- ✅ 10 productores piloto en evaluación
- ✅ Feedback positivo del sector
- ✅ Compatible con normativa SENASA

### Proyección Financiera

- **Año 1:** 200 clientes, $75K USD ARR
- **Año 2:** 800 clientes, $216K USD ARR
- **Año 3:** 2,500 clientes, $675K USD ARR

**[Ver Plan de Negocios Completo](PLAN_COMERCIAL.md)**

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2025 GanaderoApp

Se concede permiso, de forma gratuita, a cualquier persona que obtenga una copia
de este software y archivos de documentación asociados (el "Software"), para
usar el Software sin restricción, incluyendo sin limitación los derechos de
usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar, y/o
vender copias del Software...
```

---

## 📞 Contacto

### Desarrollador Principal
- **GitHub:** [@jota1308](https://github.com/jota1308)
- **Email:** contacto@ganaderoapp.com
- **LinkedIn:** [GanaderoApp](https://linkedin.com/company/ganaderoapp)

### Para Consultas

- 💼 **Inversores:** inversiones@ganaderoapp.com
- 🤝 **Partnerships:** partnerships@ganaderoapp.com
- 🐛 **Bugs/Issues:** [GitHub Issues](https://github.com/jota1308/ganaderiaAPP/issues)
- 💡 **Feature Requests:** [GitHub Discussions](https://github.com/jota1308/ganaderiaAPP/discussions)

### Links

- 🌐 **Website:** www.ganaderoapp.com *(próximamente)*
- 📱 **Demo Online:** *(próximamente)*
- 📖 **Documentación:** [Docs](docs/)
- 📺 **Video Demo:** *(próximamente)*

---

## 🙏 Agradecimientos

- Comunidad de productores ganaderos argentinos por el feedback
- Desarrolladores open source de Node.js, React y React Native
- SENASA por la normativa que hizo posible este proyecto
- Todos los contribuidores y testers beta

---

## ⭐ Dale una Estrella

Si este proyecto te resulta útil, ¡no olvides darle una ⭐ en GitHub!

Ayuda a que más productores ganaderos descubran esta herramienta.

---

<div align="center">

**Hecho con ❤️ para el sector ganadero argentino**

[Reportar Bug](https://github.com/jota1308/ganaderiaAPP/issues) · 
[Solicitar Feature](https://github.com/jota1308/ganaderiaAPP/issues) · 
[Documentación](docs/)

</div>
