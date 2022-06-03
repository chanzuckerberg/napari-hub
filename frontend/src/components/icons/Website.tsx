import { IconColorProps } from './icons.type';

export function Website({ className, color = '#000', alt }: IconColorProps) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {alt && <title>{alt}</title>}
      <circle
        cx="10.8331"
        cy="10.0835"
        r="9.33333"
        stroke={color}
        strokeWidth="1.33333"
      />
      <path
        d="M15.4998 10.0835C15.4998 12.7576 14.9202 15.1456 14.0161 16.8408C13.0967 18.5648 11.9398 19.4168 10.8331 19.4168C9.7264 19.4168 8.56951 18.5648 7.65009 16.8408C6.74594 15.1456 6.16642 12.7576 6.16642 10.0835C6.16642 7.40935 6.74594 5.02142 7.65009 3.32615C8.56951 1.60224 9.7264 0.750163 10.8331 0.750163C11.9398 0.750163 13.0967 1.60224 14.0161 3.32615C14.9202 5.02142 15.4998 7.40935 15.4998 10.0835Z"
        stroke={color}
        strokeWidth="1.33333"
      />
      <path d="M10.8331 0.270996V19.896" stroke={color} strokeWidth="1.33333" />
      <path
        d="M1.02063 10.0835L20.6456 10.0835"
        stroke={color}
        strokeWidth="1.33333"
      />
    </svg>
  );
}
