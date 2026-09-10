import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function renderButton(width) {
  const source = fs.readFileSync(new URL('../src/screens/recorder/action-button.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const modules = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: { useState: () => [width, () => {}] },
    'react-native': { View: 'View', useColorScheme: () => 'light' },
    '@expo/ui': { Button: 'Button', Host: 'Host' },
    '../../theme': { useTheme: () => ({ colorScheme: 'light' }) },
  };
  vm.runInNewContext(compiled, { exports, require: name => {
    if (!(name in modules)) throw new Error(`Unexpected module ${name}`);
    return modules[name];
  } });
  return exports.ActionButton({ label: 'Start recording', onPress() {} });
}

test('native button waits for layout instead of passing a percentage to Compose', () => {
  assert.equal(renderButton(0).props.children, null);
});

test('native button receives numeric dimensions and an explicit text label', () => {
  for (const width of [280, 360, 480]) {
    const host = renderButton(width).props.children;
    const button = host.props.children;
    assert.equal(host.props.style.width, width);
    assert.equal(button.props.style.width, width);
    assert.equal(button.props.style.height, 52);
    assert.equal(button.props.label, 'Start recording');
    assert.equal(button.props.children, undefined);
  }
});
