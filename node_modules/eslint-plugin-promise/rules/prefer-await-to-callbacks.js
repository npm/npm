/**
 * Rule: prefer-await-to-callbacks
 * Discourage using then() and instead use async/await.
 */

'use strict'

const getDocsUrl = require('./lib/get-docs-url')

const errorMessage = 'Avoid callbacks. Prefer Async/Await.'

module.exports = {
  meta: {
    docs: {
      url: getDocsUrl('prefer-await-to-callbacks')
    }
  },
  create: function(context) {
    function checkLastParamsForCallback(node) {
      const len = node.params.length - 1
      const lastParam = node.params[len]
      if (
        lastParam &&
        (lastParam.name === 'callback' || lastParam.name === 'cb')
      ) {
        context.report({ node: lastParam, message: errorMessage })
      }
    }
    function isInsideYieldOrAwait() {
      return context.getAncestors().some(function(parent) {
        return (
          parent.type === 'AwaitExpression' || parent.type === 'YieldExpression'
        )
      })
    }
    return {
      CallExpression: function(node) {
        // callbacks aren't allowed
        if (node.callee.name === 'cb' || node.callee.name === 'callback') {
          context.report({ node, message: errorMessage })
          return
        }

        // thennables aren't allowed either
        const args = node.arguments
        const num = args.length - 1
        const arg = num > -1 && node.arguments && node.arguments[num]
        if (
          (arg && arg.type === 'FunctionExpression') ||
          arg.type === 'ArrowFunctionExpression'
        ) {
          if (arg.params && arg.params[0] && arg.params[0].name === 'err') {
            if (!isInsideYieldOrAwait()) {
              context.report({ node: arg, message: errorMessage })
            }
          }
        }
      },
      FunctionDeclaration: checkLastParamsForCallback,
      FunctionExpression: checkLastParamsForCallback,
      ArrowFunctionExpression: checkLastParamsForCallback
    }
  }
}
