# 🥩 Carnicería — Control de Deudas

Sistema web para registrar clientes, ventas fiadas y deudas en una carnicería.

**Stack:** Node.js + Express + MySQL + HTML/CSS/JS puro

---

## 📁 Estructura

```
backend/
  server.js          ← Punto de entrada Express
  package.json
  .env.example       ← Plantilla de variables de entorno
  config/
    db.js            ← Conexión MySQL con pool
  routes/
    auth.js
    clientes.js
    productos.js
    ventas.js
    dashboard.js
  public/
    index.html       ← SPA (frontend completo)
    css/style.css
    js/app.js
database.sql         ← Estructura + datos iniciales MySQL
README.md
```

---

## 🚀 Despliegue en Railway (paso a paso)

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Carnicería Control de Deudas"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### 2. Crear proyecto en Railway

1. Ir a [railway.app](https://railway.app) → **New Project**
2. Seleccionar **Deploy from GitHub repo**
3. Conectar tu repositorio

### 3. Configurar el directorio raíz

En Railway → tu servicio → **Settings** → **Root Directory**:
```
backend
```
> ⚠️ Esto es importante porque `package.json` y `server.js` están dentro de `backend/`.

### 4. Crear base de datos MySQL en Railway

1. En tu proyecto Railway → **New** → **Database** → **MySQL**
2. Una vez creada, ve a **MySQL** → pestaña **Variables**
3. Copia los valores de `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQLDB`, `MYSQLPORT`

### 5. Cargar el archivo database.sql

En la pestaña **Query** de MySQL en Railway:
- Pega y ejecuta el contenido completo de `database.sql`

O usa un cliente MySQL como **TablePlus**, **DBeaver** o **MySQL Workbench** conectándote con los datos de Railway.

### 6. Configurar variables de entorno

En tu servicio de Node.js en Railway → **Variables** → agregar:

| Variable         | Valor (de MySQL en Railway)     |
|------------------|---------------------------------|
| `DB_HOST`        | El host de MySQL en Railway     |
| `DB_USER`        | El usuario MySQL                |
| `DB_PASSWORD`    | La contraseña MySQL             |
| `DB_NAME`        | El nombre de la base de datos   |
| `DB_PORT`        | El puerto MySQL (por lo general `3306`) |
| `SESSION_SECRET` | Una cadena aleatoria larga      |

Railway asigna `PORT` automáticamente; no hace falta configurarlo.

### 7. Desplegar

Railway despliega automáticamente al hacer push a `main`. También puedes presionar **Deploy** manualmente desde el panel.

---

## 💻 Correr localmente

```bash
cd backend
cp .env.example .env
# Edita .env con tus datos de MySQL local

npm install
npm start
```

Abre: http://localhost:3000

---

## 🔑 Credenciales iniciales

| Campo    | Valor |
|----------|-------|
| Usuario  | `admin` |
| Contraseña | `123` |

> **Recomendación:** cambia la contraseña directamente en la base de datos después del primer inicio de sesión.

---

## ✨ Funciones

- **Dashboard** con totales, deudas pendientes y top deudores
- **Clientes** — CRUD con búsqueda y deuda total visible
- **Venta rápida** — botones por producto (Paletilla, Hueso Rojo, Pulpa, Pecho, Molida), ingresas kilos y calcula automáticamente
- **Deudas** — filtrar por estado, ver detalle, registrar pagos parciales o totales
- **Mensaje WhatsApp** — botón "Copiar mensaje" genera texto listo para pegar en WhatsApp
- **Precios** — pantalla dedicada para cambiar el precio por kilo de cada producto

---

## 🗄️ Tablas de la base de datos

| Tabla           | Descripción                          |
|-----------------|--------------------------------------|
| `usuarios`      | Login del sistema                    |
| `clientes`      | Registro de clientes                 |
| `productos`     | Productos con precio por kilo        |
| `ventas`        | Cabecera de cada venta/deuda         |
| `venta_detalle` | Detalle de productos por venta       |
| `pagos`         | Historial de pagos por venta         |
