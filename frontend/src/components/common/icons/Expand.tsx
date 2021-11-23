import { IconColorProps } from './icons.type';

export function Expand({ alt, className, color = 'black' }: IconColorProps) {
  return (
    <svg
      className={className}
      width="8"
      height="9"
      viewBox="0 0 8 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path
        d="M5.56686 4.57102L1.5 6.91246L1.5 2.22958L5.56686 4.57102Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
