import { readFileSync } from 'fs'
import { join } from 'path'

const TOKEN = process.env.TURSO_AUTH_TOKEN
const DB_URL = process.env.DATABASE_URL  // e.g. libsql://xxx.turso.io
if (!TOKEN || !DB_URL) {
  console.error('Set TURSO_AUTH_TOKEN and DATABASE_URL')
  process.exit(1)
}

// Convert libsql:// to https://
const httpBase = DB_URL.replace(/^libsql:\/\//, 'https://')

const MIGRATIONS_DIR = 'prisma/migrations'
const dirs = [
  '20260424094155_init',
  '20260424102547_add_nextauth_tables',
  '20260425083005_add_monthly_payment',
  '20260426062110_add_classroom_and_password_reset',
  '20260426132706_add_user_status',
]

const allStatements = []
for (const dir of dirs) {
  const sql = readFileSync(join(MIGRATIONS_DIR, dir, 'migration.sql'), 'utf-8')
  const stmts = sql
    .split(';')
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0)
  allStatements.push(...stmts)
}

const requests = allStatements.map(sql => ({
  type: 'execute',
  stmt: { sql: sql + ';' },
}))
requests.push({ type: 'close' })

const res = await fetch(`${httpBase}/v2/pipeline`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ requests }),
})

const data = await res.json()
console.log('HTTP status:', res.status)

const errors = (data.results ?? []).filter(r => r.type === 'error')
if (errors.length > 0) {
  console.error('Errors:', JSON.stringify(errors, null, 2))
  process.exit(1)
} else {
  console.log(`✅ Applied ${allStatements.length} statements to Turso`)
}
