import { AxiosError } from 'axios';
import { ReactNode } from 'react';

import { hubAPI, spdxLicenseDataAPI } from '@/axios';
import { ErrorMessage } from '@/components/common';
import { PluginSearch } from '@/components/PluginSearch';
import { PluginSearchProvider } from '@/context/search';
import {
  SpdxLicenseData,
  SpdxLicenseProvider,
  SpdxLicenseResponse,
} from '@/context/spdx';
import { URLParameterStateProvider } from '@/context/urlParameters';
import { PluginIndexData } from '@/types';

interface Props {
  licenses?: SpdxLicenseData[];
  index?: PluginIndexData[];
  error?: string;
}

/**
 * Helper function that renders the textual content of the Markdown string. This
 * works by rendering the Markdown to HTML and then using a parser to extract
 * only the text.
 *
 * @param markdown The markdown string.
 * @returns The text content of the Markdown
 */
async function renderDescription(markdown: string): Promise<string> {
  // Dynamically import modules so that we only use them on the server.
  const unified = (await import('unified')).default;
  const markdownParser = (await import('remark-parse')).default;
  const gfm = (await import('remark-gfm')).default;
  const remark2rehype = (await import('remark-rehype')).default;
  const rehype2html = (await import('rehype-stringify')).default;
  const cheerio = (await import('cheerio')).default;

  // Render Markdown to HTML
  const plugins = [markdownParser, gfm, remark2rehype, rehype2html];
  const processor = plugins.reduce(
    (currentProcessor, plugin) => currentProcessor.use(plugin),
    unified(),
  );

  const html = String(processor.processSync(markdown));
  const $ = cheerio.load(`<main>${html}</main>`);

  // The `text()` method returns only the text content recursively for each element:
  // https://cheerio.js.org/classes/cheerio.html#text
  return $('main').text();
}

export async function getServerSideProps() {
  const url = '/plugins/index';
  const props: Props = {};

  try {
    const { data: index } = await hubAPI.get<PluginIndexData[]>(url);
    const {
      data: { licenses },
    } = await spdxLicenseDataAPI.get<SpdxLicenseResponse>('');

    // Replace plugin description with rendered version for indexing. This is
    // necessary so that we don't include hidden links and HTML tags in the
    // search index.
    await Promise.all(
      index.map(async (plugin) => {
        // eslint-disable-next-line no-param-reassign
        plugin.description = await renderDescription(plugin.description);
      }),
    );

    Object.assign(props, { index, licenses });
  } catch (err) {
    const error = err as AxiosError;
    props.error = error.message;
  }

  return { props };
}

export default function Home({ error, index, licenses }: Props) {
  return (
    <>
      {error ? (
        <ErrorMessage error={error}>Unable to fetch plugin index</ErrorMessage>
      ) : (
        index &&
        licenses && (
          <URLParameterStateProvider>
            <SpdxLicenseProvider licenses={licenses}>
              <PluginSearchProvider pluginIndex={index}>
                <PluginSearch />
              </PluginSearchProvider>
            </SpdxLicenseProvider>
          </URLParameterStateProvider>
        )
      )}
    </>
  );
}

// Return page by itself so we can wrap the layout with <PluginSearchProvider>
Home.getLayout = (page: ReactNode) => page;
