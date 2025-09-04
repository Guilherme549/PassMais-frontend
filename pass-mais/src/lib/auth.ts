import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

interface UserWithRole {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  password: string;
}

export const authOptions: AuthOptions = {
  pages: {
    signIn: "/medicos/login-medico",
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
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && typeof token === "object" && "role" in token) {
        const role = (token as any).role as string | undefined;
        session.user = {
          ...(session.user ?? {}),
          role,
        } as any;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
