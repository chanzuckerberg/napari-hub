import { useEffect, useState } from 'react';

import { TOC_HEADER_TAG, TOCHeader } from '@/components/TableOfContents';

export function useHeaders() {
  const [headers, setHeaders] = useState<TOCHeader[]>([]);

  useEffect(() => {
    // based off of https://www.emgoto.com/react-table-of-contents/
    const headerElements: HTMLHeadingElement[] = Array.from(
      document.querySelectorAll(`.markdown ${TOC_HEADER_TAG}`),
    );
    setHeaders(
      headerElements.map<TOCHeader>((header) => ({
        id: header.id,
        text: header.innerText,
      })),
    );
  }, []);

  return headers;
}
