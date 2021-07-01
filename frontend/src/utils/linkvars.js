/** based on https://github.com/trevorblades/remark-typescript/
 *  and https://github.com/remarkjs/remark-external-links/
 */

const visit = require('unist-util-visit');

function linkvars({ vars }) {
  return function transform(tree) {
    function visitor(node) {
      const data = node.data || (node.data = {});
      const props = data.hProperties || (data.hProperties = {});
      const { url } = node;
      let newURL = url;

      Object.entries(vars).forEach(([name, info]) => {
        const lookFor = `{${name}}`;
        if (newURL.includes(lookFor)) {
          newURL = newURL.replaceAll(lookFor, info.link);
          if (info.newTab) {
            props.target = '_blank';
            props.rel = 'noreferrer';
          }
        }
      });

      node.url = newURL;
    }

    visit(tree, 'link', visitor);
  };
}

module.exports = linkvars;
