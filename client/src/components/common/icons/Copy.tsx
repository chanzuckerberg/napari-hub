import { IconProps } from './icons.type';

export function Copy({ className, alt }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path d="M1 2V13H4.5L5 4.5H10V2H8V3H3V2H1Z" fill="black" stroke="black" />
      <rect x="3" y="1" width="5" height="2" stroke="black" />
      <path d="M5 4.5H10L13 7.5V14.5H5V4.5Z" stroke="black" />
      <path d="M10 5V8H13" stroke="black" />
    </svg>
  );
}
