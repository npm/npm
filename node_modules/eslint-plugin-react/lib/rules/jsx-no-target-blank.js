/**
 * @fileoverview Forbid target='_blank' attribute
 * @author Kevin Miller
 */
'use strict';

const docsUrl = require('../util/docsUrl');

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

function isTargetBlank(attr) {
  return attr.name.name === 'target' &&
    attr.value.type === 'Literal' &&
    attr.value.value.toLowerCase() === '_blank';
}

function hasExternalLink(element) {
  return element.attributes.some(attr => attr.name &&
      attr.name.name === 'href' &&
      attr.value.type === 'Literal' &&
      /^(?:\w+:|\/\/)/.test(attr.value.value));
}

function hasSecureRel(element) {
  return element.attributes.find(attr => {
    if (attr.type === 'JSXAttribute' && attr.name.name === 'rel') {
      const tags = attr.value && attr.value.type === 'Literal' && attr.value.value.toLowerCase().split(' ');
      return tags && (tags.indexOf('noopener') >= 0 && tags.indexOf('noreferrer') >= 0);
    }
    return false;
  });
}

module.exports = {
  meta: {
    docs: {
      description: 'Forbid target="_blank" attribute without rel="noopener noreferrer"',
      category: 'Best Practices',
      recommended: true,
      url: docsUrl('jsx-no-target-blank')
    },
    schema: []
  },

  create: function(context) {
    return {
      JSXAttribute: function(node) {
        if (node.parent.name.name !== 'a') {
          return;
        }

        if (
          isTargetBlank(node) &&
          hasExternalLink(node.parent) &&
          !hasSecureRel(node.parent)
        ) {
          context.report(node, 'Using target="_blank" without rel="noopener noreferrer" ' +
          'is a security risk: see https://mathiasbynens.github.io/rel-noopener');
        }
      }
    };
  }
};
