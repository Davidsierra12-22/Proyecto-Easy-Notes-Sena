# Guía de contribución — EasyNotes v2

Reglas para que el historial del repositorio se mantenga uniforme y ordenado.
Léelas antes de hacer el primer commit.

## 1. Convención de commits

Cada mensaje empieza con el tipo (conventional commits), en minúsculas,
en imperativo, corto y en español.

| Tipo | Uso | Ejemplo |
|---|---|---|
| `feat:` | Nueva funcionalidad o página | `feat: página de Matrículas` |
| `fix:` | Corrección de error | `fix: trim del documento en login` |
| `chore:` | Tareas internas o configuración | `chore: actualizar .gitignore` |
| `refactor:` | Reestructurar sin cambiar comportamiento | `refactor: extraer función de cálculo de notas` |
| `style:` | Formato, orden de imports, espacios | `style: ordenar imports en Layout` |
| `test:` | Pruebas | `test: cubrir flujo de cambio de contraseña` |
| `docs:` | Documentación | `docs: agregar guía de contribución` |

## 2. Commits pequeños

- Un commit por cambio (una página, una corrección o una funcionalidad).
- Revisa qué va a entrar antes: `git status` y `git diff`.
- Agrega archivos explícitos: `git add <archivo>` (evita `git add .`).
- Si un cambio mezcla varias cosas, se parte en varios commits.

**Ejemplo de buen historial:**

```
feat: página de Matrículas
fix: validar usuario duplicado en Matrículas
style: limpiar imports en Matrículas
```

## 3. Identidad en Git

Configura tu nombre y correo en tu equipo para que GitHub muestre quién
hace cada commit:

```
git config user.name  "Tu Nombre"
git config user.email "tu@correo.com"
```

Cuentas del equipo:

| Persona | Nombre | Correo |
|---|---|---|
| 1 | Martin | martineduardozapata0@gmail.com |
| 2 | Sneyder | sneyderdavier@gmail.com |
| 3 | Yorman | yormangogo@gmail.com |
| 4 | Avila | avilabarre68@gmail.com |
| 5 | Santiago | daviidsierra1422@gmail.com |

## 4. Flujo de ramas

- La rama de trabajo compartida es `develop`.
- Cada persona sube sus avances con `git push origin develop` desde su cuenta.
- Si el cambio es grande, se usa una rama propia y un Pull Request.
- `master` está protegido: **solo se integra mediante Pull Request** con review.

## 5. Reparto del frontend

El plan de trabajo por persona y el orden de entrega está en
`docs/REPARTO_FRONTEND.md`.

## 6. Verificación antes de subir

- Backend: `npm test` (en `server/`) — la suite debe pasar completa.
- Frontend: `npm run build` y `npm run lint` (en `client/`).
- No subir secretos ni datos sensibles: `.env`, API keys o tokens.
- `server/uploads/` no se versiona (archivos subidos en ejecución).