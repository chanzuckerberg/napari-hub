declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_URL_HOST: string;
    readonly API_URL: string;
    readonly BASE_PATH: string;
    readonly ENV: 'local' | 'dev' | 'staging' | 'prod';
    readonly FRONTEND_URL: string;
    readonly GITHUB_CLIENT_ID: string;
    readonly GITHUB_CLIENT_SECRET: string;
    readonly PLAUSIBLE: 'true' | 'false';
    readonly PREVIEW: string;
    readonly PREVIEW_PULL_REQUEST: string;
  }
}
