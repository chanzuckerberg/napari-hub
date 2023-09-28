import { NonFunctionKeys } from 'utility-types';

export type ClassState<T extends object> = {
  [key in NonFunctionKeys<T>]: T[key];
};

/**
 * Data used for rendering links in the app.
 */
export interface LinkInfo {
  /**
   * URL of this link.
   */
  link: string;
  /**
   * Title of the link to use.
   */
  title: string;
}

export type PickKeysForType<T, U> = keyof {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};
