import { IconProps } from './icons.type';

export function ProjectDocumentation({ className, alt }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="15"
      viewBox="0 0 12 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path d="M0.5 0.5H6.5L11.5 5.5V14.5H0.5V0.5Z" stroke="black" />
      <path d="M6 0V6H12" stroke="black" />
      <path d="M0.5 0.5H6V6H11.5V14.5H0.5V0.5Z" fill="black" stroke="black" />
    </svg>
  );
}
