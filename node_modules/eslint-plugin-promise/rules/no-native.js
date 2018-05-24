// Borrowed from here:
// https://github.com/colonyamerican/eslint-plugin-cah/issues/3

'use strict'

const getDocsUrl = require('./lib/get-docs-url')

function isDeclared(scope, ref) {
  return scope.variables.some(function(variable) {
    if (variable.name !== ref.identifier.name) {
      return false
    }

    if (!variable.defs || !variable.defs.length) {
      return false
    }

    return true
  })
}

module.exports = {
  meta: {
    docs: {
      url: getDocsUrl('no-native')
    }
  },
  create: function(context) {
    const MESSAGE = '"{{name}}" is not defined.'

    /**
     * Checks for and reports reassigned constants
     *
     * @param {Scope} scope - an escope Scope object
     * @returns {void}
     * @private
     */
    return {
      'Program:exit': function() {
        const scope = context.getScope()

        scope.implicit.left.forEach(function(ref) {
          if (ref.identifier.name !== 'Promise') {
            return
          }

          if (!isDeclared(scope, ref)) {
            context.report({
              node: ref.identifier,
              message: MESSAGE,
              data: { name: ref.identifier.name }
            })
          }
        })
      }
    }
  }
}
