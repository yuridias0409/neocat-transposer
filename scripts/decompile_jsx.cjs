const fs = require('fs');
const babel = require('@babel/core');
const t = require('@babel/types');

const visitor = {
  CallExpression: {
    exit(path) {
      if (path.node.callee.name === '_jsxDEV') {
        const [typeArg, propsArg] = path.node.arguments;
        
        let tagName;
        if (t.isStringLiteral(typeArg)) {
          tagName = t.jsxIdentifier(typeArg.value);
        } else if (t.isIdentifier(typeArg)) {
          // e.g. HumStep -> <HumStep />
          tagName = t.jsxIdentifier(typeArg.name);
        } else if (t.isMemberExpression(typeArg)) {
          tagName = t.jsxMemberExpression(
            t.jsxIdentifier(typeArg.object.name),
            t.jsxIdentifier(typeArg.property.name)
          );
        } else {
          return;
        }

        const attributes = [];
        let children = [];

        if (t.isObjectExpression(propsArg)) {
          for (const prop of propsArg.properties) {
            if (t.isObjectProperty(prop)) {
              let keyName = prop.key.name || prop.key.value;
              
              if (keyName === 'children') {
                const processChild = (el) => {
                  if (t.isJSXElement(el) || t.isJSXFragment(el)) {
                    return el;
                  }
                  if (t.isStringLiteral(el)) {
                    return t.jsxText(el.value);
                  }
                  // Wrap anything else (vars, ternaries, etc) in {}
                  return t.jsxExpressionContainer(el);
                };

                if (t.isArrayExpression(prop.value)) {
                  children = prop.value.elements.filter(Boolean).map(processChild);
                } else {
                  children = [processChild(prop.value)];
                }
              } else {
                let val = prop.value;
                if (t.isStringLiteral(val)) {
                  attributes.push(t.jsxAttribute(t.jsxIdentifier(keyName), val));
                } else {
                  attributes.push(t.jsxAttribute(t.jsxIdentifier(keyName), t.jsxExpressionContainer(val)));
                }
              }
            } else if (t.isSpreadElement(prop)) {
              attributes.push(t.jsxSpreadAttribute(prop.argument));
            }
          }
        }

        const openingElement = t.jsxOpeningElement(tagName, attributes, children.length === 0);
        const closingElement = children.length === 0 ? null : t.jsxClosingElement(tagName);
        const jsxElement = t.jsxElement(openingElement, closingElement, children);
        
        // Remove void 0, false, etc.
        path.replaceWith(jsxElement);
      }
    }
  }
};

const filesToProcess = [
  'src/features/calibrador/components/HumStep.jsx',
  'src/features/calibrador/components/MicStep.jsx',
  'src/features/calibrador/components/SuccessScreen.jsx',
  'src/features/calibrador/components/SustainBar.jsx',
  'src/features/calibrador/Calibrador.jsx'
];

for (const file of filesToProcess) {
  const code = fs.readFileSync(file, 'utf8');
  try {
    const result = babel.transformSync(code, {
      plugins: [
        function myCustomPlugin() {
          return { visitor };
        }
      ],
      parserOpts: {
        plugins: ["jsx"]
      }
    });

    // Clean up the unused _jsxDEV import
    let newCode = result.code;
    newCode = newCode.replace(/import { jsxDEV as _jsxDEV } from "react\/jsx-dev-runtime";\n?/g, '');

    fs.writeFileSync(file, newCode, 'utf8');
    console.log(`Decompiled ${file}`);
  } catch (e) {
    console.error(`Error in ${file}:`, e);
  }
}
