export type Styles = {
  inlineList: string;
  linkItem: string;
  textItem: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
