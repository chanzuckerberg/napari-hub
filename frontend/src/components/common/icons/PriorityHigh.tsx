import { IconColorProps } from './icons.type';

export function PriorityHigh({
  alt,
  className,
  color = 'black',
}: IconColorProps) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <circle cx="7.5" cy="11" r="1" fill={color} />
      <path d="M6.5 2H8.5V8H6.5V2Z" fill={color} />
    </svg>
  );
}
