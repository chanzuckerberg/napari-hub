export type Styles = {
  footer: string;
  red: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
