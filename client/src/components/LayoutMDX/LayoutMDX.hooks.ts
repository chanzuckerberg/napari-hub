import { useEffect, useState } from 'react';

import { TOC_HEADER_TAG, TOCHeader } from '@/components/common';

export function useHeaders() {
  const [headers, setHeaders] = useState<TOCHeader[]>([]);

  useEffect(() => {
    // based off of https://www.emgoto.com/react-table-of-contents/
    const headerElements = Array.from(
      document.querySelectorAll(TOC_HEADER_TAG),
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
