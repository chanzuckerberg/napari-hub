import { IconColorProps } from './icons.type';

export function ChevronDown({
  alt,
  className,
  color = 'black',
}: IconColorProps) {
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
        d="M6 12L17.8587 23.8587L29.7173 12"
        stroke={color}
        strokeWidth="3"
      />
    </svg>
  );
}
