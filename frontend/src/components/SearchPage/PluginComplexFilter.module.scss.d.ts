export type Styles = {
  autoComplete: string;
  categories: string;
  complexFilter: string;
  hiddenInputCaret: string;
  popper: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
