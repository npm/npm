/**
 * Rule: no-return-wrap function
 * Prevents uneccessary wrapping of results in Promise.resolve
 * or Promise.reject as the Promise will do that for us
 */

'use strict'

const getDocsUrl = require('./lib/get-docs-url')
const isPromise = require('./lib/is-promise')
const rejectMessage = 'Expected throw instead of Promise.reject'
const resolveMessage = 'Avoid wrapping return values in Promise.resolve'

function isInPromise(context) {
  const expression = context.getAncestors().filter(function(node) {
    return node.type === 'ExpressionStatement'
  })[0]
  return expression && expression.expression && isPromise(expression.expression)
}

module.exports = {
  meta: {
    docs: {
      url: getDocsUrl('no-return-wrap')
    }
  },
  create: function(context) {
    const options = context.options[0] || {}
    const allowReject = options.allowReject

    return {
      ReturnStatement: function(node) {
        if (isInPromise(context)) {
          if (node.argument) {
            if (node.argument.type === 'CallExpression') {
              if (node.argument.callee.type === 'MemberExpression') {
                if (node.argument.callee.object.name === 'Promise') {
                  if (node.argument.callee.property.name === 'resolve') {
                    context.report({ node, message: resolveMessage })
                  } else if (
                    !allowReject &&
                    node.argument.callee.property.name === 'reject'
                  ) {
                    context.report({ node, message: rejectMessage })
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
