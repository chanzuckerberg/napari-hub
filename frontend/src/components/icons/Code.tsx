import { IconColorProps } from './icons.type';

export function Code({ alt, className, color = 'black' }: IconColorProps) {
  return (
    <svg
      className={className}
      color={color}
      width="32"
      height="19"
      viewBox="0 0 32 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {alt && <title>{alt}</title>}
      <rect
        x="17.4"
        width="1.83452"
        height="18.2619"
        rx="0.5"
        transform="rotate(15 17.4 0)"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.53584 9.5986C3.3376 9.40322 3.33707 9.08357 3.53466 8.88754L9.12589 3.34036C9.32192 3.14588 9.6385 3.14713 9.83299 3.34316L10.4669 3.98207C10.6614 4.1781 10.6601 4.49468 10.4641 4.68917L6.23687 8.88305C6.03928 9.07909 6.03981 9.39874 6.23805 9.59412L10.4607 13.7557C10.6573 13.9496 10.6596 14.2661 10.4658 14.4628L9.83405 15.1038C9.64021 15.3005 9.32364 15.3028 9.12696 15.109L3.53584 9.5986Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27.8629 8.84957C28.0612 9.04495 28.0617 9.3646 27.8641 9.56064L22.2729 15.1078C22.0768 15.3023 21.7602 15.301 21.5658 15.105L20.9319 14.4661C20.7374 14.2701 20.7386 13.9535 20.9347 13.759L25.1619 9.56512C25.3595 9.36909 25.3589 9.04943 25.1607 8.85406L20.9381 4.69244C20.7414 4.4986 20.7391 4.18203 20.933 3.98535L21.5647 3.34434C21.7585 3.14766 22.0751 3.14536 22.2718 3.3392L27.8629 8.84957Z"
        fill="currentColor"
      />
    </svg>
  );
}
