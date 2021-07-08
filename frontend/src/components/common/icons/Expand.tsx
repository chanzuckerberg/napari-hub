import { IconProps } from './icons.type';

export function Expand({ alt, className }: IconProps) {
  return (
    <svg
      width="16"
      height="12"
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {alt && <title>{alt}</title>}
      <g clipPath="url(#clip0)">
        <path
          d="M1 2.07107L8.07107 9.14214L15.1421 2.07107"
          stroke="black"
          strokeWidth="2"
        />
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="16" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
