declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_URL: string;
    readonly API_URL_HOST: string;
    readonly ENV: 'local' | 'dev' | 'staging' | 'prod';
    readonly PLAUSIBLE: 'true' | 'false';
    readonly GITHUB_CLIENT_ID: string;
    readonly GITHUB_CLIENT_SECRET: string;
  }
}
