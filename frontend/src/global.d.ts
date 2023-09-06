declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_URL_HOST: string;
    readonly API_URL: string;
    readonly BASE_PATH: string;
    readonly CLOUDWATCH_RUM_APP_ID?: string;
    readonly CLOUDWATCH_RUM_APP_NAME?: string;
    readonly CLOUDWATCH_RUM_IDENTITY_POOL_ID?: string;
    readonly CLOUDWATCH_RUM_ROLE_ARN?: string;
    readonly E2E: 'true' | 'false';
    readonly ENV: 'local' | 'dev' | 'staging' | 'prod';
    readonly FRONTEND_URL: string;
    readonly GITHUB_CLIENT_ID: string;
    readonly GITHUB_CLIENT_SECRET: string;
    readonly PLAUSIBLE: 'true' | 'false';
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
