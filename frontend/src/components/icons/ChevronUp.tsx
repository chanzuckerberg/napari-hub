import { IconColorProps } from './icons.type';

export function ChevronUp({ alt, className, color = 'black' }: IconColorProps) {
  return (
    <svg
      className={className}
      width="35"
      height="35"
      viewBox="0 0 35 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path
        d="M30 23L18.1413 11.1413L6.28267 23"
        stroke={color}
        strokeWidth="3"
      />
    </svg>
  );
}
