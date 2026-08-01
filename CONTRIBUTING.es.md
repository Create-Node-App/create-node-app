# Cómo contribuir a Create Awesome Node App

Antes que nada, **¡gracias por tomarte el tiempo de contribuir!** 🎉

Ya sea que estés corrigiendo un bug, mejorando la documentación, agregando un template o proponiendo una funcionalidad — cada contribución ayuda a que CNA sea mejor para toda la comunidad.

> **¿Recién llegás?** Empezá revisando el [sitio oficial](https://create-awesome-node-app.vercel.app) para entender qué hace CNA, y después volvé acá para meterte de lleno.

Tené en cuenta que contamos con un [Código de Conducta](./.github/CODE_OF_CONDUCT.md) — seguilo en todas tus interacciones con el proyecto.

---

## Marca e identidad

CNA usa una identidad de **"nido acogedor" (cozy nest)** en GitHub, npm, el sitio web y los proyectos generados:

- **Paleta:** ámbar `#f59e0b` / `#d97706` + verde azulado `#0d9488` / `#14b8a6` sobre superficies oscuras cálidas (`#0f172a`)
- **Eslogan:** `One command. Any stack.` ("Un comando. Cualquier stack.")
- **Historia:** elegir template → agregar addons → publicar
- **Fuente de verdad del diseño de templates:** [`cna-templates/docs/DEFAULT_LANDING_DESIGN.md`](https://github.com/Create-Node-App/cna-templates/blob/main/docs/DEFAULT_LANDING_DESIGN.md) y [`shared/assets/`](https://github.com/Create-Node-App/cna-templates/tree/main/shared/assets)
- **Ilustraciones del repo:** `assets/repo-hero.svg` (contribuidores) y `packages/create-awesome-node-app/assets/hero.svg` (npm)

Preferimos una redacción cálida y artesanal, por sobre una estética neón/cyberpunk o el típico SaaS violeta genérico.

---

## 🐛 Reportar bugs

Usá el [rastreador de issues de GitHub](https://github.com/Create-Node-App/create-node-app/issues) para reportar bugs.

Antes de crear uno, por favor:

- Revisá los issues abiertos o cerrados recientemente para evitar duplicados
- Usá la [plantilla de reporte de bug](./.github/ISSUE_TEMPLATE/bug-report.yml)

Incluí la mayor cantidad de detalle posible:

- Un **caso de prueba reproducible** o los pasos para reproducirlo
- La **versión** del CLI que estás usando (`create-awesome-node-app --version`)
- Tu **versión de Node.js** (`node --version`) y sistema operativo
- Cualquier modificación relevante o detalle inusual del entorno

---

## 💡 Sugerir funcionalidades

¡Nos encantan las buenas ideas! Usá la [plantilla de solicitud de funcionalidad](./.github/ISSUE_TEMPLATE/feature-request.yml) en GitHub Issues.

Describí el problema que estás resolviendo y la solución que tenés en mente — cuánto más contexto, mejor.

---

## 🔀 Contribuir mediante Pull Requests

Los pull requests son la mejor forma de proponer cambios. Antes de abrir uno:

1. **Trabajá sobre la rama `main` más reciente** — asegurate de que tu fork esté actualizado
2. **Revisá los PRs existentes** — puede que alguien ya esté trabajando en lo mismo
3. **Abrí un issue primero** para cambios significativos — no queremos que pierdas tiempo en algo que no esté alineado con el roadmap

### Pasos

1. **Hacé fork** del repositorio y creá una rama a partir de `main`
2. **Hacé tus cambios** — enfocate en el fix o la funcionalidad puntual; evitá reformatear código no relacionado
3. **Asegurate de que los tests pasen** — corré `npm test` desde la raíz
4. **Escribí mensajes de commit claros** — seguí la convención de [Conventional Commits](https://www.conventionalcommits.org/) si es posible
5. **Abrí un Pull Request** — completá la plantilla y enlazá el issue relacionado
6. **Mantenete presente** — respondé a los comentarios de revisión y a los fallos de CI

Documentación de GitHub: [Hacer fork de un repo](https://help.github.com/articles/fork-a-repo/) · [Crear un pull request](https://help.github.com/articles/creating-a-pull-request/)

---

## 🧱 Contribuir templates o extensiones

Los datos de templates y extensiones viven en un repositorio separado:
**[github.com/Create-Node-App/cna-templates](https://github.com/Create-Node-App/cna-templates)**

Para agregar o actualizar un template/extensión, abrí un PR ahí siguiendo las convenciones descritas en el README de ese repo.

---

## 🔍 Encontrar en qué trabajar

- Buscá issues etiquetados como **`help wanted`** o **`good first issue`**
- Explorá los [issues abiertos](https://github.com/Create-Node-App/create-node-app/issues) en busca de bugs o funcionalidades que te interesen
- Revisá la sección de [Roadmap](./packages/create-awesome-node-app/README.md#-roadmap) en el README del CLI

---

## 🛠 Desarrollo local

```sh
# Clonar y configurar
git clone https://github.com/Create-Node-App/create-node-app.git
cd create-node-app
fnm use
npm install

# Compilar el CLI
npm run build -- --filter create-awesome-node-app

# Probar tus cambios
./packages/create-awesome-node-app/index.js my-test-app
```

---

---

## 🧪 Testing con Fixtures

El repositorio incluye un directorio `fixtures/` con un catálogo mínimo, templates y extensiones para hacer pruebas sin conexión a internet.

### Catálogo de fixtures

```sh
# Cargar el catálogo de templates/extensiones desde fixtures en lugar de GitHub
CNA_CATALOG_FIXTURE=1 ./packages/create-awesome-node-app/index.js --list-templates
CNA_CATALOG_FIXTURE=1 ./packages/create-awesome-node-app/index.js --list-addons
```

O usá el flag `--fixture`:

```sh
# Autodetectar la raíz de fixtures (funciona en un checkout de desarrollo)
./packages/create-awesome-node-app/index.js --fixture --list-templates

# Raíz de fixtures explícita (útil al correr desde otro directorio de trabajo)
./packages/create-awesome-node-app/index.js --fixture /path/to/repo --list-templates
```

### Estructura de fixtures

```text
fixtures/
  catalog/
    templates.json         # Catálogo mínimo (2 templates, 1 extensión, 2 categorías)
  templates/
    example-starter/
      cna.config.json      # Configuración de opciones personalizadas
      template.json        # Metadata de dependencias/scripts
      template/            # Archivos scaffoldeables (Lodash EJS)
        README.md
        package.json
        [src]/index.ts.template
  extensions/
    example-addon/
      package.json         # Dependencias de la extensión
      template/            # Archivos adicionales del scaffold
        jest.config.js
        .gitignore.if-pnpm # Archivo condicional según el gestor de paquetes
```

### Escribir tests con fixtures

Los tests pueden usar las variables de entorno de fixtures para evitar mockear HTTP:

```typescript
import { __resetTemplateDataCacheForTests } from "../templates.js";

// En la configuración del test:
process.env.CNA_CATALOG_FIXTURE = "1";
process.env.CNA_FIXTURE_DIR = path.resolve(__dirname, "../../../..");
__resetTemplateDataCacheForTests();

// Después del test:
delete process.env.CNA_CATALOG_FIXTURE;
delete process.env.CNA_FIXTURE_DIR;
__resetTemplateDataCacheForTests();
```

Para tests de scaffolding que necesiten repositorios git reales, consultá el patrón de test existente en
`packages/create-node-app-core/tests/git.test.mts`, que crea repositorios git "bare" locales
mediante el protocolo `file://` usando `makeLocalBareGitRepo()`.

---

### API de Fixtures (código fuente)

| Export / Helper                      | Ubicación           | Propósito                                                                         |
| ------------------------------------ | ------------------- | --------------------------------------------------------------------------------- |
| `CNA_CATALOG_FIXTURE=1`              | variable de entorno | Habilita el modo fixture en `getTemplateData()`                                   |
| `CNA_FIXTURE_DIR=<path>`             | variable de entorno | Sobrescribe la raíz de fixtures (por defecto: autodetectada desde `templates.ts`) |
| `--fixture [dir]`                    | flag del CLI        | Atajo para `CNA_CATALOG_FIXTURE=1` (y opcionalmente `CNA_FIXTURE_DIR`)            |
| `__setFixtureRootForTests(root)`     | `templates.ts`      | Sobrescribe la raíz de fixtures programáticamente en los tests                    |
| `__resetTemplateDataCacheForTests()` | `templates.ts`      | Limpia la caché en memoria del catálogo                                           |

---

De nuevo, **¡gracias!** por ayudar a que Create Awesome Node App sea cada vez mejor 🚀
