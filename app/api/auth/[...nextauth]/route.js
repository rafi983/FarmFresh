import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { generateTokens } from "@/lib/jwt";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const client = await clientPromise;
          const db = client.db("farmfresh");
          const users = db.collection("users");

          const user = await users.findOne({ email: credentials.email });

          if (
            user &&
            (await bcrypt.compare(credentials.password, user.password))
          ) {
            return {
              id: user._id,
              email: user.email,
              name: user.name,
              userType: user.userType,
              image: user.image,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userType = user.userType;
        token.userId = user.id;

        const tokens = generateTokens(user);
        token.accessToken = tokens.accessToken;
        token.refreshToken = tokens.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.userType = token.userType;
      session.user.userId = token.userId;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          const client = await clientPromise;
          const db = client.db("farmfresh");
          const users = db.collection("users");

          const existingUser = await users.findOne({ email: user.email });

          if (!existingUser) {
            const newUser = {
              email: user.email,
              name: user.name,
              firstName: user.name?.split(" ")[0] || "",
              lastName: user.name?.split(" ").slice(1).join(" ") || "",
              image: user.image,
              userType: "customer",
              provider: "google",
              googleId: profile.sub,
              phone: "",
              address: "",
              bio: "",
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await users.insertOne(newUser);
            user.id = result.insertedId.toString();
            user.userType = "customer";
          } else {
            if (!existingUser.googleId) {
              await users.updateOne(
                { email: user.email },
                {
                  $set: {
                    googleId: profile.sub,
                    provider: "google",
                    image: user.image || existingUser.image,
                    emailVerified: true,
                    updatedAt: new Date(),
                  },
                },
              );
            }
            user.id = existingUser._id.toString();
            user.userType = existingUser.userType;
          }
        } catch (error) {
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    signUp: "/register",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
