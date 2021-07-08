module.exports = {
  extends: ['airbnb/hooks'],

  rules: {
    /*
      Prop types aren't necessary since we have TypeScript interfaces for
      prop types.
    */
    'react/prop-types': 'off',

    /*
      React automatically adds the import as part of the new JSX transform:
      https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#nextjs
     */
    'react/react-in-jsx-scope': 'off',

    /*
      Prop spreading is very useful as a simple way for passing multiple
      props to a component. However, we should still be careful about passing
      unnecessary props.
    */
    'react/jsx-props-no-spreading': 'off',

    /*
      This rule isn't really needed anymore since we can use ES6 object defaults
      for props. There are also plans to deprecate the use of `defaultProps`:
      https://github.com/reactjs/rfcs/pull/107
    */
    'react/require-default-props': 'off',
  },
};
