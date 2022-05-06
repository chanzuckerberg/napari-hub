export type Styles = {
  anchor: string;
  heading2: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
