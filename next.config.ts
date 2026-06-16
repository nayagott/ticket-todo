import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // MSW v2(테스트 전용)와 그 ESM 의존성을 jest transform 대상에 포함시키기 위함
  transpilePackages: [
    'msw',
    '@mswjs/interceptors',
    'rettime',
    'until-async',
    'outvariant',
    'strict-event-emitter',
    'headers-polyfill',
    '@open-draft',
    'is-node-process',
  ],
};

export default nextConfig;
