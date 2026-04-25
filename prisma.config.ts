import { defineConfig } from 'prisma/config'
import path from 'path'

const defaultUrl = `file://${path.join(process.cwd(), 'prisma', 'dev.db')}`

// For Turso migrations, DATABASE_URL may include ?authToken=... as a query param
const dbUrl = process.env.DATABASE_URL ?? defaultUrl

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
})
