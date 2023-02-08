import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize as mdxSerialize } from 'next-mdx-remote/serialize';
import html from 'rehype-stringify';
import externalLinks from 'remark-external-links';
import slug from 'remark-slug';

/**
 * Wrapper function over the `serialize` function in `next-mdx-remote/serialize`
 * with rehype / remark plugins and default components configured.
 *
 * @param mdxString The MDX source code.
 * @returns A serialized MDX result.
 */
export async function serialize(
  mdxString: string,
): Promise<MDXRemoteSerializeResult> {
  return mdxSerialize(mdxString, {
    mdxOptions: {
      remarkPlugins: [
        slug,
        html,
        [externalLinks, { target: '_blank', rel: 'noreferrer' }],
      ],
      // https://stackoverflow.com/questions/74807529/jsxdev-is-not-a-function-when-using-mdxremote
      development: false,
    },
  });
}
