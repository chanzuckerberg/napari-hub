export type Styles = {
  appBar: string;
  header: string;
  links: string;
  menuButton: string;
  searchContainer: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
