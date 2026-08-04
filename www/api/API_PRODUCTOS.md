# API CRUD para `productos`

Tabla `productos` (MySQL):

```sql
CREATE TABLE productos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(64) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cantidad INT NOT NULL DEFAULT 0
) ENGINE=InnoDB ;
```

Base URL: `https://elrjtd.online/DDI/RENE/productos.php`

Contenido de los endpoints
- Todas las respuestas están en `application/json`.
- Para `POST` y `PUT` se recomienda enviar `Content-Type: application/json` y un body JSON.
- El parámetro `id` se pasa por query string para GET único, PUT y DELETE: `?id=1`.

1) Listar productos
- Método: `GET`
- Ruta: `/productos.php`
- Query: ninguno
- Ejemplo curl:

```bash
curl -X GET "http://localhost/DDI/API/productos.php"
```
- Respuesta (200):

```json
{
  "success": true,
  "data": [
    {"id":1,"codigo":"P001","nombre":"Producto 1","descripcion":"...","precio":10.00,"cantidad":5},
    ...
  ]
}
```

2) Obtener producto por id
- Método: `GET`
- Ruta: `/productos.php?id=1`
- Ejemplo curl:

```bash
curl -X GET "https://elrjtd.online/DDI/RENE/productos.php?id=1"
```
- Respuesta (200):

```json
{
  "success": true,
  "data": {"id":1,"codigo":"P001","nombre":"Producto 1","descripcion":"...","precio":10.00,"cantidad":5}
}
```
- Si no existe: (404)

```json
{ "success": false, "error": "Producto no encontrado" }
```

3) Crear producto
- Método: `POST`
- Ruta: `/productos.php`
- Body (JSON) requerido: `codigo`, `nombre`, `descripcion`, `precio`, `cantidad`.
- Ejemplo curl:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"codigo":"P002","nombre":"Nuevo","descripcion":"Desc","precio":99.99,"cantidad":10}' \
  "https://elrjtd.online/DDI/RENE/productos.php"
```
- Respuesta (200):

```json
{ "success": true, "inserted": 1, "id": 2 }
```
- Errores posibles: 400 si falta campo, 500 en fallo de BD.

4) Actualizar producto
- Método: `PUT`
- Ruta: `/productos.php?id=1`
- Body (JSON): cualquiera de los campos `codigo`, `nombre`, `descripcion`, `precio`, `cantidad`.
- Ejemplo curl:

```bash
curl -X PUT -H "Content-Type: application/json" \
  -d '{"precio":79.99,"cantidad":3}' \
  "http://localhost/DDI/API/productos.php?id=1"
```
- Respuesta (200):

```json
{ "success": true, "updated": 1 }
```
- Errores: 400 si no se envían campos, 404/200 según lógica si id no existe (en la implementación actual devuelve updated:0).

5) Eliminar producto
- Método: `DELETE`
- Ruta: `/productos.php?id=1`
- Ejemplo curl:

```bash
curl -X DELETE "https://elrjtd.online/DDI/RENE/productos.php?id=1"
```
- Respuesta (200):

```json
{ "success": true, "deleted": 1 }
```

Notas y recomendaciones
- Validaciones: el código actual realiza validaciones mínimas (campos presentes). Valida `precio` y `cantidad` numéricos y la unicidad de `codigo` en la BD si lo necesitas.React es el líder absoluto en el mercado laboral de desarrollo frontend. Su ecosistema inmenso de librerías, herramientas y comunidad activa lo convierte en la opción por defecto para la mayoría de empresas tecnológicas y startups a nivel mundial.
React
- Seguridad: no hay autenticación ni autorización en los endpoints; agrega middleware o comprobación de token si es necesario.
- Contenido: `POST` también acepta `application/x-www-form-urlencoded` como fallback.

Ejemplos de uso rápido (crear y obtener):

```bash
# Crear
curl -X POST -H "Content-Type: application/json" -d '{"codigo":"P010","nombre":"Prueba","descripcion":"Prueba","precio":1.23,"cantidad":2}' "http://localhost/DDI/API/productos.php"

# Obtener lista
curl -X GET "http://localhost/DDI/API/productos.php"
```

---

Archivo relacionado: `productos.php` (implementación de endpoints)
