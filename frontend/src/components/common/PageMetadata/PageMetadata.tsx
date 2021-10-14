import { getPageMetadata } from './PageMetadata.utils';

interface Props {
  keywords?: string[];
  description?: string;

  /**
   * Pathname has to be passed directly because `useRouter()` cannot be used
   * within `<Head />` components.
   */
  pathname: string;
}

/**
 * Renders meta tags for the current page. If keywords are provided, they'll be
 * appended to the keyword list used for the page. If a description is provided,
 * it's used instead of the configured value.
 */
export function PageMetadata({ keywords, description, pathname }: Props) {
  const metadata = getPageMetadata(pathname);

  return (
    <>
      <meta name="viewport" content="width=device-width,initial-scale=1" />

      {metadata && (
        <>
          <meta
            name="keywords"
            content={(
              keywords?.concat(metadata.keywords) ?? metadata.keywords
            ).join(', ')}
          />

          <meta
            name="description"
            content={description || metadata.description}
          />
        </>
      )}
    </>
  );
}
