export type Styles = {
  autoComplete: string;
  categories: string;
  complexFilter: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
