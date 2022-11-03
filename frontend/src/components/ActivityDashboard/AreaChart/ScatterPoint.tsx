import { useMediaQuery } from '@/hooks';

export function ScatterPoint({ x, y }: { x?: number; y?: number }) {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  return <circle cx={x} cy={y} r={isScreen600 ? 3 : 2} fill="#000" />;
}
