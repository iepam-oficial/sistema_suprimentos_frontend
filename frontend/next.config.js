const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Mantém server.js em .next/standalone/server.js (sem aninhar path do monorepo)
    experimental: {
        outputFileTracingRoot: path.join(__dirname),
    },
    async redirects() {
        return [
            {
                source: '/login',
                destination: '/',
                permanent: true,
            },
            {
                source: '/login/:path*',
                destination: '/',
                permanent: true,
            },
            {
                source: '/statistics',
                destination: '/reports',
                permanent: true,
            },
            {
                source: '/statistics/:path*',
                destination: '/reports',
                permanent: true,
            },
            {
                source: '/inventory/statistics',
                destination: '/reports?report=inventory-overview',
                permanent: true,
            },
        ];
    },
    logging: {
        fetches: {
            fullUrl: true
        }
    },
    reactStrictMode: true,
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
        return config;
    },
    compiler: {
        emotion: true,
    },
    env: {
        IMGBB_IMAGES_API_KEY: process.env.IMGBB_IMAGES_API_KEY,
    },
};

module.exports = nextConfig; 