import { Link } from '@/components/Link';
import { usePluginMetadata } from '@/context/plugin';

import styles from './PluginAuthors.module.scss';

export function PluginAuthors() {
  const metadata = usePluginMetadata();

  return (
    <ul className={styles.authors}>
      {metadata.authors.value.map((author) => (
        <li className="inline" key={author}>
          <Link
            className="underline text-[11px] screen-495:text-[14px] font-semibold"
            href={`/?authors=${author.replaceAll(' ', '+')}`}
          >
            {author}
          </Link>
        </li>
      ))}
    </ul>
  );
}
