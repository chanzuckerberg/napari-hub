import { IconColorProps } from './icons.type';

export function ChevronRight({
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
        d="M15.071 25.1422L22.1421 18.0711L15.071 11"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
