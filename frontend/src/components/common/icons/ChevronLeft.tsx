import { IconColorProps } from './icons.type';

export function ChevronLeft({
  alt,
  className,
  color = 'black',
}: IconColorProps) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path
        d="M21.071 11L14 18.0711L21.071 25.1421"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
