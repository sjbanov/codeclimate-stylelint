/*eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const git = require('simple-git')(`${__dirname}/.tmp_rules`);

const rulesOutput = {};

const parser = (rule, baseDir, url) => {
  const readme = fs.readFileSync(`${baseDir}${rule}/README.md`, 'utf-8');
  let excerpt;

  if (/## Options/.test(readme)) {
    excerpt = readme.replace(/\## Options[\s\S]+/, ''); //eslint-disable-line no-useless-escape
  }
  else {
    excerpt = readme.replace(/```\n[\s\S]+/ig, '```');
  }

  if (url) {
    // excerpt += `More [info](${url${d}).`;
  }

  return excerpt;
};

rimraf('.tmp_rules', error => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  fs.mkdirSync('.tmp_rules');

  console.log('Cloning repos...');

  const stylelint = new Promise((resolve, reject) => {
    git
      .clone('https://github.com/stylelint/stylelint', 'stylelint', gitError => {
        if (gitError) {
          reject(gitError);
          return;
        }

        const rulesPath = '.tmp_rules/stylelint/src/rules/';
        const rules = fs.readdirSync(rulesPath).filter(file =>
          fs.statSync(path.join(rulesPath, file)).isDirectory()
        );

        rules.forEach(d => (rulesOutput[d] = parser(d, rulesPath, 'https://github.com/stylelint/stylelint/blob/master/src/rules/')));
        resolve();
      });
  });

  const stylelintSCSS = new Promise((resolve, reject) => {
    git
      .clone('https://github.com/kristerkari/stylelint-scss', 'stylelint-scss', gitError => {
        if (gitError) {
          reject(gitError);
          return;
        }

        const rulesPath = '.tmp_rules/stylelint-scss/src/rules/';
        const rules = fs.readdirSync(rulesPath).filter(file =>
          fs.statSync(path.join(rulesPath, file)).isDirectory()
        );

        rules.forEach(d => (rulesOutput[`scss/${d}`] = parser(d, rulesPath, 'https://github.com/stylelint/stylelint/blob/master/src/rules/')));
        resolve();
      });
  });

  const stylelintOrder = new Promise((resolve, reject) => {
    git
      .clone('https://github.com/hudochenkov/stylelint-order', 'stylelint-order', gitError => {
        if (gitError) {
          reject(gitError);
          return;
        }

        const rulesPath = '.tmp_rules/stylelint-order/rules/';
        const rules = fs.readdirSync(rulesPath).filter(file =>
          fs.statSync(path.join(rulesPath, file)).isDirectory()
        );

        rules.forEach(d => (rulesOutput[`order/${d}`] = parser(d, rulesPath, 'https://github.com/stylelint/stylelint/blob/master/rules/')));
        resolve();
      });
  });

  Promise.all([stylelint, stylelintSCSS, stylelintOrder])
    .then(() => {
      fs.writeFile('rules.json', JSON.stringify(rulesOutput, null, 2), err => {
        if (err) {
          console.log(err);
        }

        console.log('rules.json saved!');
      });
    });
});
