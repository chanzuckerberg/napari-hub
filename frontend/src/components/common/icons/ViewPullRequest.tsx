import { IconColorProps } from './icons.type';

export function ViewPullRequest({
  alt,
  className,
  color = 'black',
}: IconColorProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path
        d="M5.46484 5.46481L16.4648 16.4648"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M11.1217 5.04056L5.04062 5.04056L5.04062 11.1217"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
