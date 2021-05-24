import { IconProps } from './icons.type';

export function Search({ alt, className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path
        d="M8.32004 7.68001L0.746704 15.2533M10.6667 9.60001C13.0134 9.60001 14.9334 7.68001 14.9334 5.33335C14.9334 2.98668 13.0134 1.06668 10.6667 1.06668C8.32004 1.06668 6.40004 2.98668 6.40004 5.33335C6.40004 7.68001 8.32004 9.60001 10.6667 9.60001Z"
        stroke="black"
        strokeWidth="2"
      />
    </svg>
  );
}
