import { ESLintUtils, TSESLint, TSESTree } from "@typescript-eslint/utils";
import * as tsutils from "tsutils";
import * as ts from "typescript";

export type Options = [
  {
    ignoreInsideFunctionCalls?: string;
  },
];

const defaultOptions: Options = [{}];

export const rule = ESLintUtils.RuleCreator.withoutDocs({
  defaultOptions,
  meta: {
    docs: {
      description:
        "Require type annotations for objects where there is no contextual type.",
      recommended: false,
    },
    messages: {
      forbidden: "Object is missing type annotation.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreInsideFunctionCalls: { type: "string" },
        },
      },
    ],
    type: "problem",
  },
  create: (ctx, [options]): TSESLint.RuleListener => {
    const ignoreInsideFunctionCallsRegExpStr =
      options?.ignoreInsideFunctionCalls;

    const svc = ESLintUtils.getParserServices(ctx);
    const tc = svc.program.getTypeChecker();

    return {
      ObjectExpression: (esNode: TSESTree.ObjectExpression): void => {
        const tsNode = svc.esTreeNodeToTSNodeMap.get(esNode);

        const checkObject = (n: ts.ObjectLiteralExpression): boolean => {
          const contextualType = tc.getContextualType(n);
          return (
            contextualType === undefined ||
            /**
             * Contextual type is inferred from this object node.
             *
             * Note: if two nodes are the same node they will be equal by reference.
             *
             * Examples:
             * - object passed as a function argument where the parameter type is generic, e.g.
             *   `declare const f: <T>(x: T) => T; f({ prop: 1 });``
             * - object as a function return value where the return type is generic, e.g.
             *   `[].map(() => ({ prop: 1 }))`
             */
            n === contextualType.getSymbol()?.valueDeclaration
          );
        };

        const checkCanTypeFlowToChild = (n: ts.Node): boolean =>
          tsutils.isExpression(n) || ts.isPropertyAssignment(n);

        const checkIfReportedForParents = (n: ts.Node): boolean => {
          if (checkCanTypeFlowToChild(n) === false) {
            return false;
          } else {
            return ts.isObjectLiteralExpression(n) && checkObject(n)
              ? true
              : checkIfReportedForParents(n.parent);
          }
        };

        const parentEsNode = esNode.parent;
        const parentTsNode =
          parentEsNode !== undefined
            ? svc.esTreeNodeToTSNodeMap.get(parentEsNode)
            : undefined;

        if (
          parentTsNode !== undefined &&
          checkIfReportedForParents(parentTsNode)
        ) {
          return;
        }

        // Allow empty objects
        if (tsNode.properties.length === 0) {
          return;
        }

        const stringifyLeftHandSideExpression = (
          n: ts.LeftHandSideExpression
        ): string => {
          if (ts.isCallExpression(n)) {
            return stringifyLeftHandSideExpression(n.expression);
          } else {
            return ts.isPropertyAccessExpression(n)
              ? [n.expression.getText(), n.name.getText()].join(".")
              : n.getText();
          }
        };

        if (
          ignoreInsideFunctionCallsRegExpStr !== undefined &&
          parentTsNode !== undefined &&
          ts.isCallExpression(parentTsNode) &&
          new RegExp(ignoreInsideFunctionCallsRegExpStr).test(
            stringifyLeftHandSideExpression(parentTsNode.expression)
          )
        ) {
          return;
        }

        if (checkObject(tsNode)) {
          ctx.report({
            node: esNode,
            messageId: "forbidden",
          });
        }
      },
    };
  },
});
