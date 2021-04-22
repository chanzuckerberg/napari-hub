/* eslint-disable
  import/no-default-export,
  @typescript-eslint/no-explicit-any,
*/

declare module 'remark-remove-comments' {
  import { Pluggable, Settings } from 'unified';

  const plugin: Pluggable<any[], Settings>;
  export default plugin;
}
