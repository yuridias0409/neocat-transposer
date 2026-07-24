const fs = require('fs');
const path = require('path');
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
        
        path.replaceWith(jsxElement);
      }
    }
  }
};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const filesToProcess = walk('src');
let decompiledCount = 0;

for (const file of filesToProcess) {
  const code = fs.readFileSync(file, 'utf8');
  if (code.includes('_jsxDEV')) {
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

      let newCode = result.code;
      newCode = newCode.replace(/import { jsxDEV as _jsxDEV } from "react\/jsx-dev-runtime";\n?/g, '');
      newCode = newCode.replace(/import { Fragment as _Fragment, jsxDEV as _jsxDEV } from "react\/jsx-dev-runtime";\n?/g, '');

      fs.writeFileSync(file, newCode, 'utf8');
      console.log(`Decompiled ${file}`);
      decompiledCount++;
    } catch (e) {
      console.error(`Error in ${file}:`, e);
    }
  }
}
console.log(`Decompiled ${decompiledCount} files.`);
