import clsx from 'clsx';
import { createElement, ReactHTML } from 'react';
import { ReactNode } from 'react-markdown/lib/ast-to-react';

interface TextProps {
  className?: string;
  children: string;
  weight?: 'regular' | 'bold';
  variant:
    | 'siteTitle'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'code'
    | 'sidebarHeader'
    | 'sidebarText'
    | 'sidebarCode'
    | 'bodyXXS'
    | 'bodyXS'
    | 'bodyS'
    | 'bodyM';
}

const VARIANT_ELEMENT_MAP: Record<TextProps['variant'], keyof ReactHTML> = {
  siteTitle: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  code: 'pre',
  sidebarHeader: 'h4',
  sidebarText: 'p',
  sidebarCode: 'pre',
  bodyXXS: 'p',
  bodyXS: 'p',
  bodyS: 'p',
  bodyM: 'p',
};

function VariantElement({
  children,
  className,
  variant,
}: {
  children: ReactNode;
  className?: string;
  variant: TextProps['variant'];
}) {
  let node = (
    <>{createElement(VARIANT_ELEMENT_MAP[variant], { className }, children)}</>
  );

  if (variant === 'code' || variant === 'sidebarCode') {
    node = <code className={className}>{node}</code>;
  }

  return node;
}

export function Text({ className, children, variant, weight }: TextProps) {
  return (
    <VariantElement
      className={clsx(
        className,

        variant === 'siteTitle' && [
          'font-semibold',
          'text-[33px] leading-[41.3px]',
          'screen-495:text-[51px] screen-495:leading-[63.8px]',
        ],

        variant === 'code' && [
          'font-jetbrains',
          'text-[10px] leading-[19.3px]',
          'screen-495:text-[16px] screen-495:leading-[28px]',
        ],

        variant === 'h1' && [
          'font-semibold',
          'text-[23px] leading-[30px]',
          'screen-495:text-[35px] screen-495:leading-[43.8px]',
        ],
        variant === 'h2' && [
          'font-semibold',
          'text-[16px] leading-[20px]',
          'screen-495:text-[24px] screen-495:leading-[36px]',
        ],
        variant === 'h3' && [
          'font-semibold',
          'text-[13px] leading-[16.3px]',
          'screen-495:text-[20px] screen-495:leading-[27px]',
        ],
        variant === 'h4' && [
          'font-semibold',
          'text-[11px] leading-[19.3px]',
          'screen-495:text-[17px] screen-495:leading-[24px]',
        ],
        variant === 'h5' && [
          'font-semibold',
          'text-[14px] leading-[21px]',
          'screen-495:text-[14px] screen-495:leading-[21px]',
        ],
        variant === 'h6' && [
          'font-semibold',
          'text-[11px] leading-[16.5px]',
          'screen-495:text-[11px] screen-495:leading-[16.5px]',
        ],

        variant === 'sidebarHeader' && [
          'font-semibold',
          'text-[11px] leading-[20.4px]',
          'screen-495:text-[17px] screen-495:leading-[29.8px]',
        ],
        variant === 'sidebarText' && [
          'font-semibold',
          'text-[9px] leading-[15.8px]',
          'screen-495:text-[14px] screen-495:leading-[24.5px]',
        ],
        variant === 'sidebarCode' && [
          'font-medium font-jetbrains',
          'text-[8.5px] leading-[15.8px]',
          'screen-495:text-[13px] screen-495:leading-[24.5px]',
        ],

        variant.includes('body') && weight === 'bold' && 'font-semibold',
        variant === 'bodyXXS' && 'text-[9px] leading-[15.8px]',
        variant === 'bodyXS' && 'text-[11px] leading-[16.5px]',
        variant === 'bodyS' && 'text-[14px] leading-[17.5px]',
        variant === 'bodyM' && 'text-[17px] leading-[25.5px]',
      )}
      variant={variant}
    >
      {children}
    </VariantElement>
  );
}
