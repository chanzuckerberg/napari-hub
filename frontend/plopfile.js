/* eslint-disable no-console */

const chalk = require('chalk');
const { readFileSync, writeFileSync } = require('fs');

function componentGenerator(plop) {
  /**
   * Adds export to the `component/index.ts` file so that pages can import the
   * component from `@/components`.
   */
  const addComponentExport = (data) => {
    const file = 'src/components/index.ts';
    let content = readFileSync(file, 'utf-8');

    // Add the export to the file
    content += plop.renderString(
      `export * from './{{ pascalCase name }}';`,
      data,
    );

    // Sort exports by component name
    content = content.split('\n').sort().join('\n');

    // Add a newline because POSIX :)
    content += '\n';

    writeFileSync(file, content);

    return `Added component export to ${chalk.cyan(file)} `;
  };

  plop.setGenerator('component', {
    description: 'Create a new component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the component?',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/components/{{ pascalCase name }}/index.ts',
        templateFile: 'plop-templates/component/index.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/components/{{ pascalCase name }}/{{ pascalCase name }}.tsx',
        templateFile: 'plop-templates/component/Component.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/components/{{ pascalCase name }}/{{ pascalCase name }}.test.tsx',
        templateFile: 'plop-templates/component/Component.test.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/components/{{ pascalCase name }}/{{ pascalCase name }}.module.scss',
        templateFile: 'plop-templates/component/Component.module.scss.hbs',
      },
      {
        type: 'add',
        path: 'src/components/{{ pascalCase name }}/{{ pascalCase name }}.module.scss.d.ts',
        templateFile: 'plop-templates/component/Component.module.scss.d.ts.hbs',
      },
      addComponentExport,
    ],
  });
}

function pageGenerator(plop) {
  plop.setGenerator('page', {
    description: 'Create a new page',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the page?',
      },
      {
        type: 'confirm',
        name: 'isMarkdown',
        message: 'Is it a Markdown page?',
        default: false,
      },
    ],
    actions(data) {
      const actions = [];

      if (data.isMarkdown) {
        actions.push({
          type: 'add',
          path: 'src/pages/{{ dashCase name }}.tsx',
          templateFile: 'plop-templates/page/page.tsx.hbs',
        });
      } else {
        actions.push({
          type: 'add',
          path: 'src/pages/{{ dashCase name }}.mdx',
          templateFile: 'plop-templates/page/page.mdx.hbs',
        });
      }

      return actions;
    },
  });
}

function plopfile(plop) {
  const generators = [componentGenerator, pageGenerator];
  generators.forEach((generator) => generator(plop));
}

module.exports = plopfile;
