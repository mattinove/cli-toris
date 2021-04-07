#!/usr/bin/env node
import * as template from './utils/template';
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import * as yargs from 'yargs';
import * as inquirer from 'inquirer';
import chalk from 'chalk';


export interface CliOptions {
  projectName: string;
  templateName: string;
  templatePath: string;
  targetPath: string;
}

const CURR_DIR = process.cwd();

const OPTIONS = fs.readdirSync(path.join(__dirname, 'templates'));

const QUESTIONS = [
  {
    name: 'template',
    type: 'list',
    message: 'What project template would you like to generate ?',
    choices: OPTIONS,
    when: () => !yargs.argv['template']
  },
  {
    name: 'name',
    type: 'input',
    message: 'Project name:',
    when: () => !yargs.argv['name']
  }
];

function createProjectFolder(path: string) {
  if (fs.existsSync(path)) {
    console.log(chalk.red(`Folder ${path} exists. Delete or use another name.`));
    return false;
  }
  fs.mkdirSync(path);
  return true;
}

const SKIP_FILES = ['node_modules', '.template.json'];
function createDirectoryContents(templatePath: string, name: string) {
  const filesToCreate = fs.readdirSync(templatePath);
  filesToCreate.forEach(file => {
    const origFilePath = path.join(templatePath, file);
    const stats = fs.statSync(origFilePath);
    if (SKIP_FILES.indexOf(file) > -1) return;
    if (stats.isFile()) {
      let contents = fs.readFileSync(origFilePath, 'utf-8');
      contents = template.render(contents, { projectName: name });
      const writePath = path.join(CURR_DIR, name, file);
      fs.writeFileSync(writePath, contents, 'utf-8');
    } else if (stats.isDirectory()) {
      fs.mkdirSync(path.join(CURR_DIR, name, file));
      createDirectoryContents(path.join(templatePath, file), path.join(name, file));
    }
  })
}

function postProcess(options: CliOptions) {
  const isNode = fs.existsSync(path.join(options.templatePath, 'package.json'));
  if (isNode) {
    shell.cd(options.targetPath);
    const result = shell.exec('npm i');
    if (result.code !== 0) {
      return false;
    }
    return true;
  }
}

inquirer.prompt(QUESTIONS)
  .then(answers => {
    answers = Object.assign({}, answers, yargs.argv);
    const opts: CliOptions = {
      projectName: answers['name'],
      templateName: answers['template'],
      templatePath: path.join(__dirname, 'templates', answers['template']),
      targetPath: path.join(CURR_DIR, answers['name'])
    }
    if (createProjectFolder(opts.targetPath)) {
      createDirectoryContents(opts.templatePath, opts.projectName);
      postProcess(opts);
    }
    return;
  });