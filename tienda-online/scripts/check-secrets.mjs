// Revisión rápida de seguridad: busca claves o tokens escritos en el código.
// Uso: npm run check:secrets   (se ejecuta también en GitHub Actions)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src', 'android/app/src', 'capacitor.config.ts'];
const EXTS = new Set(['.ts', '.js', '.mjs', '.html', '.json', '.xml', '.java', '.kt', '.gradle', '.properties']);
const IGNORE = new Set(['node_modules', 'build', 'public', '.gradle', 'test', 'androidTest']);

const PATTERNS = [
  { name: 'Google API key', re: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'Token JWT', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'Clave privada', re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Asignación de secreto', re: /(api[_-]?key|secret|password|storePassword|keyPassword)\s*[:=]\s*['"][^'"\s]{6,}['"]/i },
  { name: 'URL sin HTTPS', re: /['"]http:\/\/(?!localhost|127\.0\.0\.1|schemas\.android\.com|www\.w3\.org)[^'"]+['"]/ },
];

function* walk(path) {
  const st = statSync(path, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isFile()) { yield path; return; }
  for (const entry of readdirSync(path)) {
    if (IGNORE.has(entry)) continue;
    yield* walk(join(path, entry));
  }
}

let findings = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (!EXTS.has(extname(file))) continue;
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const { name, re } of PATTERNS) {
        if (line.includes('xmlns')) continue; // espacios de nombres XML no son URLs reales
        if (re.test(line)) {
          findings++;
          console.log(`⚠  ${name}: ${file}:${i + 1}\n   ${line.trim().slice(0, 120)}`);
        }
      }
    });
  }
}

if (findings) {
  console.error(`\n✖ Se encontraron ${findings} posibles secretos. Revísalos antes de hacer commit.`);
  process.exit(1);
}
console.log('✔ No se encontraron claves ni URLs inseguras en el código.');
