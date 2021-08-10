export type Styles = {
  code: string;
  copyButton: string;
  lineNumbers: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
