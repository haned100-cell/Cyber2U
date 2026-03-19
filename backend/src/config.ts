import dotenv from 'dotenv';

dotenv.config();

interface Config {
  appUrl: string;
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  email: {
    from: string;
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  formsubmit: {
    endpoint: string;
  };
}

const config: Config = {
  appUrl: process.env.APP_URL || 'http://localhost:3001',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'cyber2u_user',
    password: process.env.DB_PASSWORD || 'developmentpassword',
    database: process.env.DB_NAME || 'cyber2u_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@cyber2u.local',
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_PORT || '1025', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  formsubmit: {
    endpoint: process.env.FORMSUBMIT_ENDPOINT || 'https://formsubmit.co',
  },
};

export default config;
