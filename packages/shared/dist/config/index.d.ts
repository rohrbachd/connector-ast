import convict from 'convict';
declare const config: convict.Config<{
    env: string;
    port: number;
    databaseUrl: string;
    redisUrl: string;
}>;
export default config;
//# sourceMappingURL=index.d.ts.map