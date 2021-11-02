export type Styles = {
  missingDocumentation: string;
  missingGithub: string;
  missingProjectIssues: string;
  missingProjectSupport: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
