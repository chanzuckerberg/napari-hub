import { IconProps } from './icons.type';

export function ProjectIssues({ className, alt }: IconProps) {
  return (
    <svg
      className={className}
      width="15"
      height="13"
      viewBox="0 0 15 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path d="M1 12L7.5 1L14 12H1Z" fill="black" stroke="black" />
      <circle cx="7.5" cy="10.5" r="0.5" fill="white" />
      <rect x="7" y="4" width="1" height="4" fill="white" />
    </svg>
  );
}
