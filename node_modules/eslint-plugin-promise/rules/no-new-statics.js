'use strict'

const PROMISE_STATICS = require('./lib/promise-statics')
const getDocsUrl = require('./lib/get-docs-url')

module.exports = {
  meta: {
    docs: {
      url: getDocsUrl('no-new-statics')
    }
  },
  create(context) {
    return {
      NewExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'Promise' &&
          PROMISE_STATICS.indexOf(node.callee.property.name) > -1
        ) {
          context.report({
            node,
            message: "Avoid calling 'new' on 'Promise.{{ name }}()'",
            data: { name: node.callee.property.name }
          })
        }
      }
    }
  }
}
