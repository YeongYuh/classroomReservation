import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from './prisma'
import { Role } from '@prisma/client'
import { checkRateLimit, getClientIp } from './rate-limit'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const ip = getClientIp(request as unknown as Request)
        const { allowed } = checkRateLimit(`login:${ip}`, { maxAttempts: 10, windowMs: 15 * 60 * 1000 })
        if (!allowed) return null

        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name ?? '', role: user.role }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
    async signIn({ user, account }) {
      // Google OAuth: create TeacherProfile stub if role is TEACHER
      // For OAuth sign-ins, check if new user and set defaults
      if (account?.provider === 'google' && user.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (dbUser && !dbUser.role) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: Role.STUDENT },
          })
        }
      }
      return true
    },
  },
})

// Type augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
    }
  }
}
