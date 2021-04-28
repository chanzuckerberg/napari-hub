export type Styles = {
  markdown: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
