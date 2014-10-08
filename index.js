#!/usr/bin/env node
var chokidar = require('chokidar');
var fs       = require('fs');
var exec     = require('child_process').exec;

if (process.argv.length < 3) {
  console.error('Please provide a path to watch');
  process.exit(1);
}

var path = process.argv[2];
if (! fs.existsSync(path) || ! fs.statSync(path).isDirectory()) {
  console.error('Please provide a valid path to watch; must exist, and be a directory');
  process.exit(1);
}

path = fs.realpathSync(path);
process.chdir(path);

console.log('Watching', path, 'starting in 3s...');

var watcher = chokidar.watch(path, {
  ignored: function (path) {
    /* skip swap files */
    if (path.match(/\..*\.sw.?$/)) {
      return true;
    }

    /* skip undo files */
    if (path.match(/\~$/)) {
      return true;
    }

    /* skip git subdirs */
    if (path.match(/\.git\//)) {
      return true;
    }
    return false;
  },
  persistent: true
});

watcher
  .on('add', phpunit)
  .on('change', phpunit)
  .on('unlink', phpunit)
  .on('unlinkDir', phpunit)
  .on('error', errorHandler);

var warmup  = true;
setTimeout(function() {
  warmup = false;
}, 3000);

var running = false;
var backoff = 0;
var phpunitExecutable = locatePhpunit(path);

function phpunit(path) {
  if (! path || warmup) {
    return;
  }

  console.log('Detected change in file', path);

  if (backoff > 4) {
    console.error('Exiting; too many delayed PHPUnit executions');
    process.exit(1);
  }

  if (running) {
    console.log('Delaying next PHPUnit execution 1s');
    backoff += 1;
    
    setTimeout(function () {
      phpunit(path);
    }, 1000);
    return;
  }

  running = true;
  console.log('Executing PHPUnit (', phpunitExecutable, ')');
  exec(phpunitExecutable, function (error, stdout, stderr) {
    console.log(stdout);
    console.error(stderr);
    if (error !== null) {
      console.error('Error executing PHPUnit; exited with code', error.code);
    }

    backoff = (backoff === 0) ? 0 : backoff - 1;
    running = false;
  });
}

function errorHandler (error) {
  console.error('Error watching filesystem:', error);
}

function locatePhpunit(path) {
  var phpunit;
  var test;
  var locations = [
    path + '/vendor/bin/phpunit',
    path + '/bin/phpunit'
  ];

  for (var i = 0; i < locations.length; i += 1) {
    test = locations[i];
    if (! fs.existsSync(test)) {
      continue;
    }

    phpunit = test;
    break;
  }

  if (! phpunit) {
    phpunit = 'phpunit';
  }

  return phpunit;
}
