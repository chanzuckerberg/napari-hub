export type Styles = {
  empty: string;
  inline: string;
  linkItem: string;
  list: string;
  preview: string;
  textItem: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
