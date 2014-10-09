phpunit-watch
=============

Node utility for executing phpunit on filesystem changes.

Installation
------------

```console
$ git clone weierophinney/phpunit-watch
$ cd phpunit-watch
$ npm install
$ cd ~/bin # or any other entry on your $PATH
$ ln -s path/to/phpunit-watch/index.js phpunit-watch
```

Usage
-----

```console
$ cd some/project
$ phpunit-watch .
```

At that point, any changes you make in that directory will trigger phpunit to execute.

Notes
-----

- If phpunit exists as `vendor/bin/phpunit` or `bin/phpunit` of the directory being watched, that executable will be used; otherwise, it will use whatever phpunit is on your path.
- A backoff functionality is built in; if additional changes are registered while phpunit is still running, they will be delayed until the current run is complete. If too many changes pile up while phpunit is already running, phpunit-watch will exit; this is currently hard-coded to 5.
- The script assumes that you can run phpunit from the top-level directory of your project.
