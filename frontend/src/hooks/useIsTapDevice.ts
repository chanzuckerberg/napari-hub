import { useEffect, useState } from 'react';
import { useMedia } from 'react-use';

/**
 * Hook for determining if the current browser is on a tap device. It's stored
 * in state and set within an effect so that there isn't a UI mismatch during
 * hydration because `isTap === false` on the server and `isTap === true` on the
 * browser.
 */
export function useIsTapDevice() {
  const isTap = useMedia('(any-hover: none)');
  const [isTapDevice, setIsTapDevice] = useState(false);

  useEffect(() => setIsTapDevice(isTap), [isTap]);

  return isTapDevice;
}
