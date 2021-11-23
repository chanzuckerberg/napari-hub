export type Styles = {
  accordion: string;
  expanded: string;
  expandIcon: string;
  summary: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
