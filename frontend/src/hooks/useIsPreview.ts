import { useRouter } from 'next/router';

export function useIsPreview() {
  const router = useRouter();
  return !!(process.env.PREVIEW && router.pathname.includes('/preview'));
}
