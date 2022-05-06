import { IconProps } from './icons.type';

export function Close({ className, alt }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path d="M1 1L17 17" stroke="white" strokeWidth="2.35294" />
      <path d="M17 1L1 17" stroke="white" strokeWidth="2.35294" />
    </svg>
  );
}
