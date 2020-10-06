//
// see stackoverflow (Since Jest 25, coverage reports are having different source path)
// https://stackoverflow.com/questions/60323177/since-jest-25-coverage-reports-are-having-a-different-source-path
const fs = require('fs');

const file = './coverage/lcov.info';

fs.readFile(file, 'utf8', (err,data) => {
  if (err) {
    return console.error(err);
  }
  const result = data.replace(/src/g, `${process.cwd()}/src`);

  fs.writeFile(file, result, 'utf8', (err) => {
    if (err) return console.error(err);
  });
});
