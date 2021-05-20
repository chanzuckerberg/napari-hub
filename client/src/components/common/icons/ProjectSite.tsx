import { IconProps } from './icons.type';

export function ProjectSite({ className, alt }: IconProps) {
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
      <path d="M2.86395 5.49995V14.4999H6" stroke="black" />
      <path d="M1 7.36396L7.36396 0.999999L13.7279 7.36396" stroke="black" />
      <path
        d="M3 5.5L7.5 2L11.5 5.5V14.5H9.5V8.5H5.5V14.5H3V5.5Z"
        fill="black"
        stroke="black"
      />
      <path d="M11.864 5.49995V14.4999H9" stroke="black" />
    </svg>
  );
}
