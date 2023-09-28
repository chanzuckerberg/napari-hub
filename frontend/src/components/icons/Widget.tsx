import { IconProps } from './icons.type';

export function Widget({ className, alt }: IconProps) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.4502 3.27021C1.4502 2.82839 1.80837 2.47021 2.2502 2.47021H8.38733C8.82915 2.47021 9.18733 2.82839 9.18733 3.27021V9.40735C9.18733 9.84917 8.82915 10.2073 8.38733 10.2073H2.2502C1.80837 10.2073 1.4502 9.84917 1.4502 9.40735V3.27021ZM3.0502 4.07021V8.60735H7.58733V4.07021H3.0502Z"
        fill="#68C8FF"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.4502 13.4631C1.4502 13.0213 1.80837 12.6631 2.2502 12.6631H8.38733C8.82915 12.6631 9.18733 13.0213 9.18733 13.4631V19.6002C9.18733 20.042 8.82915 20.4002 8.38733 20.4002H2.2502C1.80837 20.4002 1.4502 20.042 1.4502 19.6002V13.4631ZM3.0502 14.2631V18.8002H7.58733V14.2631H3.0502Z"
        fill="#68C8FF"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.8696 13.4631C11.8696 13.0213 12.2278 12.6631 12.6696 12.6631H18.8068C19.2486 12.6631 19.6068 13.0213 19.6068 13.4631V19.6002C19.6068 20.042 19.2486 20.4002 18.8068 20.4002H12.6696C12.2278 20.4002 11.8696 20.042 11.8696 19.6002V13.4631ZM13.4696 14.2631V18.8002H18.0068V14.2631H13.4696Z"
        fill="#68C8FF"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8308 6.90553C10.5184 6.59311 10.5184 6.08658 10.8308 5.77416L15.1704 1.43455C15.4828 1.12213 15.9894 1.12213 16.3018 1.43455L20.6414 5.77416C20.9538 6.08658 20.9538 6.59311 20.6414 6.90553L16.3018 11.2451C15.9894 11.5576 15.4828 11.5576 15.1704 11.2451L10.8308 6.90553ZM12.5279 6.33984L15.7361 9.54808L18.9443 6.33984L15.7361 3.13161L12.5279 6.33984Z"
        fill="#68C8FF"
      />
    </svg>
  );
}
