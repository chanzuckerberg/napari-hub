import { FaLifeRing } from 'react-icons/fa';

import { IconColorProps } from './icons.type';

export function ProjectSupport({ className, color = '#000' }: IconColorProps) {
  return <FaLifeRing className={className} color={color} size={20} />;
}
