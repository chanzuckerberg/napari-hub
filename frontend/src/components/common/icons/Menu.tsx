import { IconProps } from './icons.type';

export function Menu({ alt, className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {alt && <title>{alt}</title>}
      <path d="M16 1H0" stroke="black" strokeWidth="1.98857" />
      <path d="M16 7.99924H0" stroke="black" strokeWidth="1.98857" />
      <path d="M16 15H0" stroke="black" strokeWidth="1.98857" />
    </svg>
  );
}
