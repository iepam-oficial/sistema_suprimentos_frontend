import baseUrl from '@/utils/enviroments';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const response = await fetch(`${baseUrl}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Erro na autenticação');
                    }

                    return {
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        role: data.user.role,
                        accessToken: data.accessToken || data.token,
                        refreshToken: data.refreshToken,
                    };
                } catch (error) {
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
}; 