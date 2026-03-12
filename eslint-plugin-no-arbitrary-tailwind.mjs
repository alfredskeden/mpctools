/**
 * Custom ESLint plugin that disallows arbitrary Tailwind CSS values
 * (e.g. bg-[#fff], w-[200px], text-[14px]) in className attributes.
 *
 * Matches patterns like: word-[value], word-[value]/opacity,
 * -word-[value], hover:word-[value], sm:word-[value], etc.
 */

const ARBITRARY_VALUE_PATTERN = /(?:^|[\s"'`])(?:!|-)?(?:[\w-]+:)*[\w-]+\[(?!&)[^\]]+\]/;

const noArbitraryValue = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow arbitrary values in Tailwind CSS classes",
    },
    messages: {
      noArbitrary:
        "Avoid arbitrary Tailwind values (e.g. '{{value}}'). Use a design token from your theme instead.",
    },
    schema: [],
  },
  create(context) {
    function checkString(node, value) {
      if (typeof value !== "string") return;
      const match = value.match(ARBITRARY_VALUE_PATTERN);
      if (match) {
        context.report({
          node,
          messageId: "noArbitrary",
          data: { value: match[0].trim() },
        });
      }
    }

    function checkExpression(node) {
      if (!node) return;
      if (node.type === "Literal" && typeof node.value === "string") {
        checkString(node, node.value);
      } else if (node.type === "TemplateLiteral") {
        for (const quasi of node.quasis) {
          checkString(quasi, quasi.value.raw);
        }
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name.name !== "className") return;
        const value = node.value;
        if (!value) return;

        if (value.type === "Literal") {
          checkString(node, value.value);
        } else if (value.type === "JSXExpressionContainer") {
          const expr = value.expression;
          checkExpression(expr);

          // Handle template literals and string concatenation in ternaries
          if (expr.type === "TemplateLiteral") {
            for (const quasi of expr.quasis) {
              checkString(node, quasi.value.raw);
            }
            for (const expression of expr.expressions) {
              checkExpression(expression);
            }
          }
        }
      },

      // Also check cn() and clsx() calls
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === "Identifier" &&
          (callee.name === "cn" || callee.name === "clsx" || callee.name === "twMerge")
        ) {
          for (const arg of node.arguments) {
            checkExpression(arg);
          }
        }
      },
    };
  },
};

const plugin = {
  rules: {
    "no-arbitrary-value": noArbitraryValue,
  },
};

export default plugin;
