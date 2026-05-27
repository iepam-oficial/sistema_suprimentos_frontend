/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
    experimental: {
        outputFileTracingRoot: undefined,
    },
};

module.exports = nextConfig; 