/**
 * 🚀 Deploy M&B Trend — Supabase Online
 *
 * Aplica migraciones SQL a la base de datos online de Supabase.
 * Solo corre las migraciones que NO se han aplicado antes
 * (usa una tabla _schema_migrations para trackear el estado).
 *
 * ## Uso
 *
 *   1. Configurar variables de entorno (ver .env.example):
 *      - SUPABASE_DB_HOST (ej: db.xxxxx.supabase.co)
 *      - SUPABASE_DB_PASSWORD (tu contraseña de base de datos)
 *      Opcional:
 *      - SUPABASE_DB_PORT (default: 5432)
 *      - SUPABASE_DB_NAME (default: postgres)
 *      - SUPABASE_DB_USER (default: postgres)
 *
 *   2. Ejecutar:
 *      node scripts/deploy-supabase.mjs
 *
 *   Para aplicar solo migraciones nuevas (por defecto):
 *      node scripts/deploy-supabase.mjs
 *
 *   Para forzar TODAS las migraciones desde cero:
 *      node scripts/deploy-supabase.mjs --force
 *
 *   Para forzar una migración específica:
 *      node scripts/deploy-supabase.mjs --migration 00005
 *
 *   Para ver el estado de las migraciones sin aplicar nada:
 *      node scripts/deploy-supabase.mjs --status
 *
 *   Para cargar seed data (catálogo):
 *      node scripts/deploy-supabase.mjs --seed
 *
 *   Para cargar storage buckets:
 *      node scripts/deploy-supabase.mjs --storage
 */

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SUPABASE_DIR = path.join(PROJECT_ROOT, 'supabase');
const MIGRATIONS_DIR = path.join(SUPABASE_DIR, 'migrations');
const SEED_CATALOG = path.join(SUPABASE_DIR, 'seed-catalog.sql');
const SEED_STORAGE = path.join(SUPABASE_DIR, 'seed.sql');

// ---------------------------------------------------------------------------
// Config desde variables de entorno
// ---------------------------------------------------------------------------

function loadConfig() {
  // Intentar cargar .env desde la raíz del proyecto
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  const host = process.env.SUPABASE_DB_HOST;
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (!host) {
    console.error('');
    console.error('❌ Falta SUPABASE_DB_HOST');
    console.error('');
    console.error('  Creá un archivo .env en la raíz del proyecto con:');
    console.error('');
    console.error('  SUPABASE_DB_HOST=db.xxxxx.supabase.co');
    console.error('  SUPABASE_DB_PASSWORD=tu_contraseña');
    console.error('');
    process.exit(1);
  }

  if (!password) {
    console.error('');
    console.error('❌ Falta SUPABASE_DB_PASSWORD');
    console.error('');
    console.error('  Agregala al .env:');
    console.error('');
    console.error('  SUPABASE_DB_PASSWORD=tu_contraseña');
    console.error('');
    process.exit(1);
  }

  return {
    host,
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    family: 4,  // Forzar IPv4 (el DNS del host solo resuelve IPv6)
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function leerSql(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function color(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}

const green = (t) => color(t, 32);
const red = (t) => color(t, 31);
const yellow = (t) => color(t, 33);
const blue = (t) => color(t, 36);
const bold = (t) => color(t, 1);

async function listMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((file) => {
    const filePath = path.join(MIGRATIONS_DIR, file);
    return {
      file,
      filePath,
      // Extraer el número de migración (ej: '00005' de '00005_finance_extras.sql')
      id: file.split('_')[0],
      description: file.replace(/^\d+_/, '').replace(/\.sql$/, '').replace(/_/g, ' '),
    };
  });
}

// ---------------------------------------------------------------------------
// Migration tracking table
// ---------------------------------------------------------------------------

const SCHEMA_MIGRATIONS_TABLE = '_schema_migrations';

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists ${SCHEMA_MIGRATIONS_TABLE} (
      id          text primary key,
      file_name   text not null,
      description text not null,
      applied_at  timestamptz not null default now(),
      hash        text not null
    );
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    `SELECT id, file_name, description, applied_at, hash
     FROM ${SCHEMA_MIGRATIONS_TABLE}
     ORDER BY id`,
  );
  return rows;
}

async function recordMigration(client, migration, hash) {
  await client.query(
    `INSERT INTO ${SCHEMA_MIGRATIONS_TABLE} (id, file_name, description, hash)
     VALUES ($1, $2, $3, $4)`,
    [migration.id, migration.file, migration.description, hash],
  );
}

function hashFile(content) {
  // Hash simple (no criptográfico) para detectar cambios en migraciones ya aplicadas
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    const chr = content.charCodeAt(i);
    h = ((h << 5) - h) + chr;
    h |= 0;
  }
  return h.toString(16);
}

// ---------------------------------------------------------------------------
// Ejecutar SQL
// ---------------------------------------------------------------------------

async function ejecutarSql(client, sql, descripcion, ignorarExistentes = true) {
  try {
    console.log(`  ▶ ${descripcion}...`);
    await client.query(sql);
    console.log(`  ${green('✅')} ${descripcion}`);
    return true;
  } catch (err) {
    // Errores comunes de "ya existe" que se pueden ignorar
    const msg = err.message || '';
    const ignorables = [
      'already exists',
      'duplicate key',
      'already has a policy',
      'already has a trigger',
      'relation "_schema_migrations" already exists',
    ];

    if (ignorarExistentes && ignorables.some((i) => msg.includes(i))) {
      console.log(`  ${yellow('⚠')} ${descripcion} — ${yellow('ya existe, se omite')}`);
      return false;
    }

    console.error(`  ${red('❌')} ${descripcion}: ${red(msg)}`);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------

async function cmdStatus(client) {
  await ensureMigrationTable(client);
  const applied = await getAppliedMigrations(client);
  const available = await listMigrations();

  console.log(`\n${bold('📋 Estado de migraciones')}\n`);

  const appliedMap = new Map(applied.map((m) => [m.id, m]));

  for (const mig of available) {
    const a = appliedMap.get(mig.id);
    if (a) {
      console.log(`  ${green('✅')} ${mig.id} — ${mig.description}`);
      console.log(`       Aplicada: ${a.applied_at}`);
    } else {
      console.log(`  ${yellow('⏳')} ${mig.id} — ${mig.description} ${yellow('(pendiente)')}`);
    }
  }

  console.log('');
  console.log(`  ${applied.length} aplicadas, ${available.length - applied.length} pendientes`);
}

async function cmdApply(client, { force, singleId } = {}) {
  await ensureMigrationTable(client);
  const applied = await getAppliedMigrations(client);
  const appliedIds = new Set(applied.map((m) => m.id));
  const available = await listMigrations();

  let pendientes;

  if (singleId) {
    const mig = available.find((m) => m.id === singleId);
    if (!mig) {
      console.error(`  ${red('❌')} No se encontró migración con id ${singleId}`);
      return;
    }
    pendientes = [mig];
    console.log(`\n${bold(`▶ Aplicando migración ${singleId} específica`)}\n`);
  } else if (force) {
    pendientes = available;
    console.log(`\n${bold('▶ Modo FORCE: aplicando TODAS las migraciones')}\n`);
  } else {
    pendientes = available.filter((m) => !appliedIds.has(m.id));
    if (pendientes.length === 0) {
      console.log(`\n${green('✅ Todas las migraciones ya están aplicadas.')}\n`);
      return;
    }
    console.log(`\n${bold(`▶ Aplicando ${pendientes.length} migración(es) pendiente(s)`)}\n`);
  }

  for (const mig of pendientes) {
    const sql = leerSql(mig.filePath);
    if (!sql) {
      console.error(`  ${red('❌')} No se pudo leer ${mig.file}`);
      continue;
    }

    const hash = hashFile(sql);
    const yaAplicada = appliedIds.has(mig.id);

    if (yaAplicada && !force) {
      console.log(`  ${yellow('⚠')} ${mig.file} — ${yellow('ya aplicada, se omite')}`);
      continue;
    }

    if (yaAplicada && force) {
      // En modo force, intentamos re-aplicar. Usamos transacción:
      // 1. Ejecutar SQL
      // 2. Si funciona, borrar registro viejo
      // 3. Si falla, no perdemos el registro
      const exito = await ejecutarSql(client, sql, mig.file);
      if (exito) {
        await client.query(`DELETE FROM ${SCHEMA_MIGRATIONS_TABLE} WHERE id = $1`, [mig.id]);
        await recordMigration(client, mig, hash);
        console.log(`  ${green('✅')} Re-aplicada y registrada en ${SCHEMA_MIGRATIONS_TABLE}`);
      }
      continue;
    }

    const exito = await ejecutarSql(client, sql, mig.file);
    if (exito) {
      await recordMigration(client, mig, hash);
      console.log(`  ${green('✅')} Registrada en ${SCHEMA_MIGRATIONS_TABLE}`);
    }
  }

  // Mostrar resumen
  const nowApplied = await getAppliedMigrations(client);
  console.log(`\n${bold('📊 Resumen:')} ${nowApplied.length}/${available.length} migraciones aplicadas\n`);
}

async function cmdSeed(client) {
  console.log(`\n${bold('🌱 Cargando seed data')}\n`);

  // Seed catálogo
  const seedSql = leerSql(SEED_CATALOG);
  if (seedSql) {
    await ejecutarSql(client, seedSql, 'Seed: catálogo (categorías, productos, variantes)');
  } else {
    console.log(`  ${yellow('⚠')} Archivo no encontrado: seed-catalog.sql`);
  }

  // Verificar
  const countCategories = await client.query(
    'SELECT count(*)::int as count FROM categories;',
  );
  const countProducts = await client.query(
    'SELECT count(*)::int as count FROM products;',
  );
  const countVariants = await client.query(
    'SELECT count(*)::int as count FROM product_variants;',
  );
  console.log(`\n  📊 Datos cargados:`);
  console.log(`     Categorías: ${countCategories.rows[0].count}`);
  console.log(`     Productos: ${countProducts.rows[0].count}`);
  console.log(`     Variantes: ${countVariants.rows[0].count}`);
}

async function cmdStorage(client) {
  console.log(`\n${bold('🪣 Configurando Storage')}\n`);

  const storageSql = leerSql(SEED_STORAGE);
  if (storageSql) {
    await ejecutarSql(client, storageSql, 'Seed: Storage (buckets + políticas RLS)');
  } else {
    console.log(`  ${yellow('⚠')} Archivo no encontrado: seed.sql`);
  }
}

async function cmdVerify(client) {
  console.log(`\n${bold('🔍 Verificando base de datos')}\n`);

  // Tablas públicas
  const { rows: tablas } = await client.query(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_type, table_name;
  `);

  if (tablas.length > 0) {
    console.log(`  ${green('✅')} Tablas encontradas (${tablas.length}):`);
    for (const t of tablas) {
      const icon = t.table_type === 'VIEW' ? '👁' : '📋';
      console.log(`     ${icon} ${t.table_name} (${t.table_type.toLowerCase()})`);
    }
  } else {
    console.log(`  ${yellow('⚠')} No se encontraron tablas públicas`);
  }

  // Funciones
  const { rows: funciones } = await client.query(`
    SELECT routine_name
    FROM information_schema.routines
    WHERE specific_schema = 'public'
    ORDER BY routine_name;
  `);

  if (funciones.length > 0) {
    console.log(`\n  ${green('✅')} Funciones encontradas (${funciones.length}):`);
    for (const f of funciones) {
      console.log(`     ⚙ ${f.routine_name}`);
    }
  }

  // Versión PostgreSQL
  const { rows: version } = await client.query('SELECT version();');
  console.log(`\n  🐘 PostgreSQL: ${version[0].version.split(',')[0]}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const flags = {
    force: args.includes('--force'),
    status: args.includes('--status'),
    seed: args.includes('--seed'),
    storage: args.includes('--storage'),
    verify: args.includes('--verify'),
    help: args.includes('--help') || args.includes('-h'),
  };

  let singleId = null;
  const migIdx = args.indexOf('--migration');
  if (migIdx !== -1 && args[migIdx + 1]) {
    singleId = args[migIdx + 1];
  }

  if (flags.help) {
    console.log(`
${bold('🚀 Deploy M&B Trend — Supabase Online')}

${bold('USO:')}
  node scripts/deploy-supabase.mjs [opciones]

${bold('OPCIONES:')}
  (sin args)     Aplica migraciones pendientes
  --force        Re-aplica TODAS las migraciones
  --migration N  Aplica solo la migración N (ej: --migration 00005)
                 Si ya fue aplicada, usar --migration N --force para re-aplicar
  --status       Muestra estado actual sin aplicar nada
  --seed         Carga seed data (catálogo)
  --storage      Configura storage buckets
  --verify       Verifica tablas, vistas y funciones
  --help, -h     Muestra esta ayuda

${bold('EJEMPLOS:')}
  node scripts/deploy-supabase.mjs
  node scripts/deploy-supabase.mjs --status
  node scripts/deploy-supabase.mjs --migration 00005
  node scripts/deploy-supabase.mjs --seed
  node scripts/deploy-supabase.mjs --verify
`);
    process.exit(0);
  }

  // Si no hay flags específicas, aplicar migraciones por defecto
  const mode = flags.status ? 'status'
    : flags.seed ? 'seed'
    : flags.storage ? 'storage'
    : flags.verify ? 'verify'
    : singleId ? 'apply-single'
    : 'apply';

  // Cargar config
  const dbConfig = loadConfig();

  console.log('');
  console.log(`  ${bold('🚀 Deploy M&B Trend — Supabase Online')}`);
  console.log(`  ${blue('─────────────────────────────────────')}`);
  console.log(`  Host: ${dbConfig.host}`);
  console.log(`  Puerto: ${dbConfig.port}`);
  console.log(`  Base: ${dbConfig.database}`);
  console.log(`  Usuario: ${dbConfig.user}`);
  console.log('');

  // Conectar
  console.log(`  📡 Conectando...`);
  const client = new pg.Client(dbConfig);

  try {
    await client.connect();
    console.log(`  ${green('✅')} Conexión establecida\n`);

    switch (mode) {
      case 'status':
        await cmdStatus(client);
        break;
      case 'seed':
        await cmdSeed(client);
        break;
      case 'storage':
        await cmdStorage(client);
        break;
      case 'verify':
        await cmdVerify(client);
        break;
      case 'apply-single':
        await cmdApply(client, { singleId });
        // Verificar resultado
        await cmdVerify(client);
        break;
      default:
        await cmdApply(client, { force: flags.force });
        // Verificar resultado
        await cmdVerify(client);
        break;
    }

    console.log(`  ${bold(green('✅ DEPLOY COMPLETADO'))}\n`);
  } catch (err) {
    console.error(`\n  ${red('❌ Error:')} ${err.message}\n`);
    process.exit(1);
  } finally {
    await client.end();
    console.log(`  🔌 Conexión cerrada.\n`);
  }
}

main();
