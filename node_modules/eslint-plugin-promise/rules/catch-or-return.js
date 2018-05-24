/**
 * Rule: catch-or-return
 * Ensures that promises either include a catch() handler
 * or are returned (to be handled upstream)
 */

'use strict'

const getDocsUrl = require('./lib/get-docs-url')
const isPromise = require('./lib/is-promise')

module.exports = {
  meta: {
    docs: {
      url: getDocsUrl('catch-or-return')
    }
  },
  create: function(context) {
    const options = context.options[0] || {}
    const allowThen = options.allowThen
    let terminationMethod = options.terminationMethod || 'catch'

    if (typeof terminationMethod === 'string') {
      terminationMethod = [terminationMethod]
    }

    return {
      ExpressionStatement: function(node) {
        if (!isPromise(node.expression)) {
          return
        }

        // somePromise.then(a, b)
        if (
          allowThen &&
          node.expression.type === 'CallExpression' &&
          node.expression.callee.type === 'MemberExpression' &&
          node.expression.callee.property.name === 'then' &&
          node.expression.arguments.length === 2
        ) {
          return
        }

        // somePromise.catch()
        if (
          node.expression.type === 'CallExpression' &&
          node.expression.callee.type === 'MemberExpression' &&
          terminationMethod.indexOf(node.expression.callee.property.name) !== -1
        ) {
          return
        }

        // somePromise['catch']()
        if (
          node.expression.type === 'CallExpression' &&
          node.expression.callee.type === 'MemberExpression' &&
          node.expression.callee.property.type === 'Literal' &&
          node.expression.callee.property.value === 'catch'
        ) {
          return
        }

        context.report({
          node,
          message: 'Expected {{ terminationMethod }}() or return',
          data: { terminationMethod }
        })
      }
    }
  }
}
