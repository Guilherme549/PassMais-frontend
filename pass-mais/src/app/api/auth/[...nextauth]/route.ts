import NextAuth, { AuthOptions } from "next-auth"; // Importe AuthOptions explicitamente
import CredentialsProvider from "next-auth/providers/credentials";

// Estendendo o tipo User para incluir role
declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  }
}

interface UserWithRole {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  password: string;
}

export const authOptions: AuthOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const users: UserWithRole[] = [
          {
            id: "1",
            name: "Guilherme",
            email: "guilhermevs54@gmail.com",
            password: "123456",
            role: "user",
          },
          {
            id: "2",
            name: "Admin User",
            email: "admin@example.com",
            password: "admin123",
            role: "admin",
          },
        ];

        const user = users.find(
          (u) =>
            u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const, // Define explicitamente como "jwt" com tipo literal
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };