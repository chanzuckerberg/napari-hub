declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_URL: string;
    readonly API_URL_HOST: string;
    readonly GITHUB_CLIENT_ID: string;
    readonly GITHUB_CLIENT_SECRET: string;
  }
}
