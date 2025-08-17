import convict from 'convict';
import type { Schema } from 'convict';

interface AppConfig {
  env: 'production' | 'development' | 'test';
  controlPlane: {
    port: number;
  };
  dataPlane: {
    port: number;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
}

const schema: Schema<AppConfig> = {
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  controlPlane: {
    port: {
      doc: 'The port for the control plane.',
      format: 'port',
      default: 3000,
      env: 'CP_PORT',
    },
  },
  dataPlane: {
    port: {
      doc: 'The port for the data plane.',
      format: 'port',
      default: 3001,
      env: 'DP_PORT',
    },
  },
  database: {
    url: {
      doc: 'The database connection URL.',
      format: String,
      default: 'postgresql://connector:connector@localhost:5432/connector',
      env: 'DATABASE_URL',
    },
  },
  redis: {
    url: {
      doc: 'The Redis connection URL.',
      format: String,
      default: 'redis://localhost:6379',
      env: 'REDIS_URL',
    },
  },
};

const config = convict<AppConfig>(schema);
config.validate({ allowed: 'strict' });

export default config;
export type { AppConfig };
