import { IconProps } from './icons.type';

interface Props extends IconProps {
  checked?: boolean;
}

export function CheckboxIcon({ className, alt, checked = false }: Props) {
  const title = alt ?? `${checked ? '' : 'un'}checked checkbox`;

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>{title}</title>
      <rect x="0.5" y="0.5" width="13" height="13" stroke="black" />
      {checked && (
        <path stroke="black" strokeWidth="1.5" d="M2.5 7 l3 3 l6 -6" />
      )}
    </svg>
  );
}
