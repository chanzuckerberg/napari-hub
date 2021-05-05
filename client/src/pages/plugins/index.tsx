import axios, { AxiosError } from 'axios';

import { ErrorMessage, Link } from '@/components/common';

const API_URL = process.env.API_URL || 'http://localhost:8081';

interface Props {
  plugins?: Record<string, string>;
  error?: string;
}

/**
 * Fetches plugin dictionary from hub API. The returned dictionary maps plugin
 * names to their latest version.
 */
export async function getServerSideProps() {
  const url = `${API_URL}/plugins`;
  const props: Partial<Props> = {};

  try {
    const { data } = await axios.get<Record<string, string>>(url);
    props.plugins = data;
  } catch (err) {
    const error = err as AxiosError;
    props.error = error.message;
  }

  return { props };
}

/**
 * Page for rendering links to all napari plugins. This is mostly a test page
 * for viewing plugins while the search / landing page is being created.
 */
export default function PluginListPage({ plugins = {}, error }: Props) {
  return (
    <>
      {error ? (
        <ErrorMessage error={error}>Unable to load plugins</ErrorMessage>
      ) : (
        <div className="flex flex-col p-6 md:p-12">
          {Object.entries(plugins).map(([name, version]) => {
            const label = `${name}@${version}`;
            const url = `/plugins/${name}`;

            return (
              <Link className="my-1" key={label} href={url} newTab>
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
