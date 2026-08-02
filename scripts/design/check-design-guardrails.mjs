#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const componentsPath = path.join(
  rootDir,
  'TimeGuesser Design System/ui_kits/mobile_app/components.jsx'
);
const prototypeIndexPath = path.join(
  rootDir,
  'TimeGuesser Design System/ui_kits/mobile_app/index.html'
);
const settingsPath = path.join(rootDir, 'app/(tabs)/settings.tsx');
const designReadmePath = path.join(rootDir, 'TimeGuesser Design System/README.md');
const repoReadmePath = path.join(rootDir, 'README.md');
const agentsPath = path.join(rootDir, 'AGENTS.md');
const taskIndexPath = path.join(rootDir, 'AGENT_TASK_INDEX.md');

function indexOfOrThrow(source, token, file) {
  const idx = source.indexOf(token);
  if (idx === -1) throw new Error(`Missing "${token}" in ${path.relative(rootDir, file)}.`);
  return idx;
}

function assertSettingsOrder(source, file, mode) {
  const labels = ['Theme', 'Map Provider', 'Photo Sources', 'Image Cache', 'Hints', 'Round Timer'];
  const positions = [];

  for (const label of labels) {
    let idx = -1;
    if (mode === 'react-native') {
      if (label === 'Photo Sources' || label === 'Image Cache') {
        idx = source.indexOf(`}>${label}</Text>`);
      }
      if (label === 'Theme' || label === 'Map Provider' || label === 'Hints' || label === 'Round Timer') {
        idx = source.indexOf(`<Text style={styles.rowTitle}>${label}</Text>`);
      }
    } else {
      idx = source.indexOf(`label="${label}"`);
      if (idx === -1 && (label === 'Photo Sources' || label === 'Image Cache')) {
        idx = source.indexOf(`>${label}</div>`);
      }
    }
    if (idx === -1) {
      throw new Error(`Missing settings label "${label}" in ${path.relative(rootDir, file)}.`);
    }
    positions.push({ label, idx });
  }

  for (let i = 1; i < positions.length; i += 1) {
    if (positions[i].idx < positions[i - 1].idx) {
      throw new Error(
        `Settings label "${positions[i].label}" appears out of order in ${path.relative(rootDir, file)}.`
      );
    }
  }
}

function main() {
  const components = fs.readFileSync(componentsPath, 'utf8');
  const prototypeIndex = fs.readFileSync(prototypeIndexPath, 'utf8');
  const settings = fs.readFileSync(settingsPath, 'utf8');
  const designReadme = fs.readFileSync(designReadmePath, 'utf8');
  const repoReadme = fs.readFileSync(repoReadmePath, 'utf8');
  const agents = fs.readFileSync(agentsPath, 'utf8');
  const taskIndex = fs.readFileSync(taskIndexPath, 'utf8');

  indexOfOrThrow(components, 'window.__TG_TOKENS__', componentsPath);
  indexOfOrThrow(prototypeIndex, 'tokens.js', prototypeIndexPath);
  indexOfOrThrow(designReadme, 'Settings order (canonical):', designReadmePath);
  indexOfOrThrow(repoReadme, 'Canonical design package entrypoint:', repoReadmePath);
  indexOfOrThrow(agents, 'Canonical design entrypoint for humans/agents', agentsPath);
  indexOfOrThrow(taskIndex, 'Canonical design package entrypoint', taskIndexPath);

  if (repoReadme.includes('Design tokens and rules: `TIMEGUESSER_DESIGN_SYSTEM.md`')) {
    throw new Error('README.md still contains legacy canonical wording for TIMEGUESSER_DESIGN_SYSTEM.md.');
  }

  assertSettingsOrder(settings, settingsPath, 'react-native');
  assertSettingsOrder(components, componentsPath, 'prototype');

  console.log('Design guardrails check passed.');
}

main();
