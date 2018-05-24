/**
 * @fileoverview Forbid certain props on components
 * @author Joe Lencioni
 */
'use strict';

const docsUrl = require('../util/docsUrl');

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

const DEFAULTS = ['className', 'style'];

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: 'Forbid certain props on components',
      category: 'Best Practices',
      recommended: false,
      url: docsUrl('forbid-component-props')
    },

    schema: [{
      type: 'object',
      properties: {
        forbid: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      additionalProperties: true
    }]
  },

  create: function(context) {
    function isForbidden(prop) {
      const configuration = context.options[0] || {};

      const forbid = configuration.forbid || DEFAULTS;
      return forbid.indexOf(prop) >= 0;
    }

    return {
      JSXAttribute: function(node) {
        const tag = node.parent.name.name;
        if (tag && tag[0] !== tag[0].toUpperCase()) {
          // This is a DOM node, not a Component, so exit.
          return;
        }

        const prop = node.name.name;

        if (!isForbidden(prop)) {
          return;
        }

        context.report({
          node: node,
          message: `Prop \`${prop}\` is forbidden on Components`
        });
      }
    };
  }
};
