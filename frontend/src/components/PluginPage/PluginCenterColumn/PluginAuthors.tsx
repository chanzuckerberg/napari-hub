import { Link } from '@/components/Link';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { usePluginMetadata } from '@/context/plugin';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

import styles from './PluginAuthors.module.scss';

export function PluginAuthors() {
  const metadata = usePluginMetadata();
  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');

  return (
    <SkeletonLoader
      className="h-[20px] mb-sds-s"
      render={() => (
        <ul className={styles.authors}>
          {metadata.authors.value.map((author) => (
            <li className="inline" key={author}>
              <Link
                className="underline text-[11px] screen-495:text-[14px] font-semibold"
                href={`${
                  isHomePageRedesign ? '/plugins' : '/'
                }?authors=${author.replaceAll(' ', '+')}`}
              >
                {author}
              </Link>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
