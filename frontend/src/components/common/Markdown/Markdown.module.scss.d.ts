export type Styles = {
  markdown: string;
  placeholder: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
