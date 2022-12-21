declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_URL_HOST: string;
    readonly API_URL: string;
    readonly BASE_PATH: string;
    readonly ENV: 'local' | 'dev' | 'staging' | 'prod';
    readonly E2E: 'true' | 'false';
    readonly FRONTEND_URL: string;
    readonly GITHUB_CLIENT_ID: string;
    readonly GITHUB_CLIENT_SECRET: string;
    readonly PLAUSIBLE: 'true' | 'false';
    readonly PREVIEW_PULL_REQUEST: string;
    readonly PREVIEW: string;
    readonly SPLIT_IO_SERVER_KEY: string;
  }
}

namespace HubSpotFormAPI {
  /**
   * HubSpot form creation options.
   * https://legacydocs.hubspot.com/docs/methods/forms/advanced_form_options
   */
  export interface CreateFormOptions {
    region: string;
    portalId: string;
    formId: string;
    target?: string;
  }

  export interface HubSpotForm {
    create(options: CreateFormOptions): void;
  }
  export interface HubSpot {
    forms: HubSpotForm;
  }
}

declare const hbspt: HubSpotFormAPI.HubSpot;
