module.exports = {
  rules: {
    'no-root-mui-import': {
      create(context) {
        return {
          ImportDeclaration(node) {
            const value = node.source.value || '';
            if (
              typeof value === 'string' &&
              /@mui\/(\w+)$/.exec(node.source.value)
            ) {
              context.report(
                node,
                "Don't use root `@mui/*` imports for better build performance.",
              );
            }
          },
        };
      },
    },
  },
};
