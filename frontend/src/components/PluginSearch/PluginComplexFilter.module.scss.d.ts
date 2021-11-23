export type Styles = {
  autoComplete: string;
  complexFilter: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
