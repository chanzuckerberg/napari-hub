export type Styles = {
  inline: string;
  linkItem: string;
  list: string;
  textItem: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
