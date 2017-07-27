#!/usr/bin/env node
const {join} = require('path'),
  taskRunner = require('../lib/task-runner');

const tasks = require(join(process.cwd(), 'lerna.js'));
const taskName = process.argv[3];

taskRunner(console, process)(tasks, taskName);