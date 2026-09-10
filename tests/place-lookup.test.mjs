import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const observation = { latitude: 12.34, longitude: 56.78, measuredAt: 1, accuracy: null,
  altitude: null, altitudeAccuracy: null, speed: null, heading: null, mocked: null };

function makeHarness({ appState = 'active', granted = true } = {}) {
  const source = fs.readFileSync(new URL('../src/screens/recorder/place-lookup.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  const exports = {};
  const jsx = (type, props) => typeof type === 'function' ? type(props ?? {}) : ({ type, props: props ?? {} });
  const state = [];
  const appStateValue = { currentState: appState };
  let stateIndex = 0;
  const refs = [];
  let refIndex = 0;
  const location = { permissionCalls: 0, reverseCalls: 0,
    async getForegroundPermissionsAsync() { location.permissionCalls++; return { granted }; },
    async reverseGeocodeAsync() { location.reverseCalls++; return [{ formattedAddress: 'Fixture place' }]; } };
  const modules = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: {
      useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
      useRef(initial) { const index = refIndex++; if (!(index in refs)) refs[index] = { current: initial }; return refs[index]; },
    },
    'react-native': { AppState: appStateValue, StyleSheet: { create: styles => styles }, Text: 'Text', View: 'View' },
    'expo-location': location,
    '../../evidence/record': {},
    '../../theme': { fonts: { medium: 'medium', regular: 'regular' }, usePalette: () => ({ ink: 'ink', muted: 'muted', accentSoft: 'soft', warning: 'warning' }) },
    './action-button': { ActionButton: ({ label, onPress, disabled }) => ({ type: 'ActionButton', props: { label, onPress, disabled } }) },
  };
  vm.runInNewContext(compiled, { exports, process: { env: { EXPO_OS: 'ios' } }, require: name => {
    if (!(name in modules)) throw new Error(`Unexpected module ${name}`);
    return modules[name];
  } });
  const render = () => { stateIndex = 0; refIndex = 0; return exports.PlaceLookup({ observation }); };
  const buttons = tree => {
    const result = [];
    const visit = node => { if (!node || typeof node !== 'object') return; if (node.type === 'ActionButton') result.push(node); for (const child of Object.values(node.props ?? {})) { if (Array.isArray(child)) child.forEach(visit); else visit(child); } };
    visit(tree); return result;
  };
  return { location, render, buttons, appState: appStateValue };
}

test('render and first Look up click make zero geocoder calls until consent', () => {
  const h = makeHarness();
  const first = h.buttons(h.render())[0];
  assert.equal(h.location.permissionCalls, 0);
  assert.equal(h.location.reverseCalls, 0);
  first.props.onPress();
  assert.deepEqual(h.buttons(h.render()).map(button => button.props.label), ['Allow this lookup', 'Cancel']);
  assert.equal(h.location.permissionCalls, 0);
  assert.equal(h.location.reverseCalls, 0);
});

test('Cancel does not start a lookup', () => {
  const h = makeHarness();
  h.buttons(h.render())[0].props.onPress();
  h.buttons(h.render()).find(button => button.props.label === 'Cancel').props.onPress();
  assert.equal(h.buttons(h.render())[0].props.label, 'Look up address');
  assert.equal(h.location.permissionCalls, 0);
  assert.equal(h.location.reverseCalls, 0);
});

test('Allow this lookup is the only path that calls foreground geocoder', async () => {
  const h = makeHarness();
  h.buttons(h.render())[0].props.onPress();
  h.buttons(h.render()).find(button => button.props.label === 'Allow this lookup').props.onPress();
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(h.location.permissionCalls, 1);
  assert.equal(h.location.reverseCalls, 1);
});

test('background state makes Allow this lookup a no-op', async () => {
  const h = makeHarness();
  h.buttons(h.render())[0].props.onPress();
  h.appState.currentState = 'background';
  h.buttons(h.render()).find(button => button.props.label === 'Allow this lookup').props.onPress();
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(h.location.permissionCalls, 0);
  assert.equal(h.location.reverseCalls, 0);
});

test('denied foreground permission prevents geocoder request', async () => {
  const h = makeHarness({ granted: false });
  h.buttons(h.render())[0].props.onPress();
  h.buttons(h.render()).find(button => button.props.label === 'Allow this lookup').props.onPress();
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(h.location.permissionCalls, 1);
  assert.equal(h.location.reverseCalls, 0);
});
