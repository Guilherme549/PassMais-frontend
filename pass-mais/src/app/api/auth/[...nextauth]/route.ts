import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

     const handler = NextAuth({
       pages: {
         signIn: "/",
       },
       providers: [
         CredentialsProvider({
           name: "Credentials",
           credentials: {
             email: { label: "Email", type: "email", placeholder: "jsmith" },
             password: { label: "Password", type: "password" },
           },
           async authorize(credentials) {
             if (!credentials?.email || !credentials?.password) {
               return null;
             }

             if (credentials.email === "guilhermevs54@gmail.com" && credentials.password === "123456") {
               return {
                 id: "1",
                 name: "Guilherme",
                 email: "guilhermevs54@gmail.com",
               };
             }

             return null;
           },
         }),
       ],
     });

     export { handler as GET, handler as POST };
