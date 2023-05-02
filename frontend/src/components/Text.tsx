import clsx from 'clsx';
import { createElement, ReactHTML } from 'react';
import { ReactNode } from 'react-markdown/lib/ast-to-react';

interface TextProps {
  children: ReactNode;
  className?: string;
  element?: keyof ReactHTML;
  italic?: boolean;
  weight?: 'regular' | 'bold' | 'semibold';
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
  element,
  variant,
}: {
  children: ReactNode;
  className?: string;
  element?: keyof ReactHTML;
  variant: TextProps['variant'];
}) {
  let node = (
    <>
      {createElement(
        element ?? VARIANT_ELEMENT_MAP[variant],
        { className },
        children,
      )}
    </>
  );

  if (variant === 'code' || variant === 'sidebarCode') {
    node = <code className={className}>{node}</code>;
  }

  return node;
}

export function Text({
  children,
  className,
  element,
  italic,
  variant,
  weight,
}: TextProps) {
  return (
    <VariantElement
      className={clsx(
        className,

        variant === 'siteTitle' && [
          'font-semibold',
          'text-[35px] leading-[43.8px]',
          'screen-495:text-[51px] screen-495:leading-[63.8px]',
        ],

        variant === 'code' && [
          'font-jetbrains',
          'text-[10px] leading-[19.3px]',
          'screen-495:text-[16px] screen-495:leading-[28px]',
        ],

        variant === 'h1' && [
          'font-semibold',
          'text-[24px] leading-[36px]',
          'screen-495:text-[35px] screen-495:leading-[43.8px]',
        ],
        variant === 'h2' && [
          'font-semibold',
          'text-[20px] leading-[27px]',
          'screen-495:text-[24px] screen-495:leading-[36px]',
        ],
        variant === 'h3' && [
          'font-semibold',
          'text-[18px] leading-[26px]',
          'screen-495:text-[20px] screen-495:leading-[27px]',
        ],
        variant === 'h4' && [
          'font-semibold',
          'text-[16px] leading-[23px]',
          'screen-495:text-[17px] screen-495:leading-[24px]',
        ],
        variant === 'h5' && 'font-semibold text-[14px] leading-[21px]',
        variant === 'h6' && 'font-semibold text-[12px] leading-[18px]',

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

        variant.includes('body') && [
          weight === 'bold' && 'font-bold',
          weight === 'semibold' && 'font-semibold',
        ],
        variant === 'bodyXXS' && 'text-[9px] leading-[15.8px]',
        variant === 'bodyXS' && 'text-[12px] leading-[16.5px]',
        variant === 'bodyS' && 'text-[14px] leading-[17.5px]',
        variant === 'bodyM' && 'text-[17px] leading-[25.5px]',

        italic && 'italic',
      )}
      element={element}
      variant={variant}
    >
      {children}
    </VariantElement>
  );
}
