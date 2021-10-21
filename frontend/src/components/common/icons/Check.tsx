import { IconColorProps } from './icons.type';

export function Check({ alt, className, color = 'black' }: IconColorProps) {
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
      <path
        d="M3.5 7.38672L6.3995 10.2862L11.7868 4.89895"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}
