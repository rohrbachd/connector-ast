import convict from 'convict';

const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT',
  },
  databaseUrl: {
    doc: 'The database connection URL.',
    format: String,
    default: 'postgresql://connector:connector@localhost:5432/connector',
    env: 'DATABASE_URL',
  },
  redisUrl: {
    doc: 'The Redis connection URL.',
    format: String,
    default: 'redis://localhost:6379',
    env: 'REDIS_URL',
  },
});

config.validate({ allowed: 'strict' });

export default config;