import { createMedia } from '@artsy/fresnel';

import breakpoints from '@/breakpoints';

const AppMedia = createMedia({ breakpoints });

/**
 * Styles for SSR.
 */
export const mediaStyles = AppMedia.createMediaStyle();

export const {
  /**
   * This component provides an easy-to-use API for responding to media
   * queries.
   */
  Media,

  /**
   * This provides context data related to the media query component.
   */
  MediaContextProvider,
} = AppMedia;
