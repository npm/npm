"use strict";

module.exports = function (_ref) {
  var t = _ref.types;

  function liftDeclaration(path, body, kind) {
    if (body[0] && body[0].isVariableDeclaration({
      kind: kind
    })) {
      if (body[0].node.declarations.length > 1) {
        return;
      }

      if (body[1] && body[1].isVariableDeclaration({
        kind: kind
      })) {
        return;
      }

      var firstNode = body[0].node.declarations[0];

      if (!t.isIdentifier(firstNode.id) || !firstNode.init) {
        return;
      }

      var init = path.get("init");

      if (!init.isVariableDeclaration({
        kind: kind
      })) {
        return;
      }

      init.pushContainer("declarations", t.variableDeclarator(firstNode.id));
      body[0].replaceWith(t.assignmentExpression("=", t.clone(firstNode.id), t.clone(firstNode.init)));
    }
  }

  return {
    name: "transform-merge-sibling-variables",
    visitor: {
      ForStatement(path) {
        // Lift declarations to the loop initializer
        var body = path.get("body");
        body = body.isBlockStatement() ? body.get("body") : [body];
        liftDeclaration(path, body, "var");
        liftDeclaration(path, body, "let");
      },

      VariableDeclaration: {
        enter: [// concat variables of the same kind with their siblings
        function (path) {
          if (!path.inList) {
            return;
          }

          var node = path.node;
          var sibling = path.getSibling(path.key + 1);

          while (sibling.isVariableDeclaration({
            kind: node.kind
          })) {
            node.declarations = node.declarations.concat(sibling.node.declarations);
            sibling.remove();
            sibling = path.getSibling(path.key + 1);
          }
        }, // concat `var` declarations next to for loops with it's initialisers.
        // block-scoped `let` and `const` are not moved because the for loop
        // is a different block scope.
        function (path) {
          if (!path.inList) {
            return;
          }

          var node = path.node;

          if (node.kind !== "var") {
            return;
          }

          var next = path.getSibling(path.key + 1);

          if (!next.isForStatement()) {
            return;
          }

          var init = next.get("init");

          if (!init.isVariableDeclaration({
            kind: node.kind
          })) {
            return;
          }

          var declarations = node.declarations.concat(init.node.declarations); // temporary workaround to forces babel recalculate scope,
          // references and binding until babel/babel#4818 resolved

          path.remove();
          init.replaceWith(t.variableDeclaration("var", declarations));
        }]
      }
    }
  };
};