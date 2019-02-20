"use strict";

var clc = require("cli-color");
var _ = require("lodash");

var Command = require("../command");
var logger = require("../logger");
var utils = require("../utils");
var requirePermissions = require("../requirePermissions");
var requireConfig = require("../requireConfig");
var checkDupHostingKeys = require("../checkDupHostingKeys");
var serve = require("../serve/index");
var filterTargets = require("../filterTargets");
var getProjectNumber = require("../getProjectNumber");

var VALID_EMULATORS = ["database", "firestore"];
var VALID_TARGETS = ["functions", "hosting"];

var filterOnlyEmulators = (only) => {
  if (!only) {
    return [];
  }
  return _.intersection(
    VALID_EMULATORS,
    only.split(",").map((opt) => {
      return opt.split(":")[0];
    })
  );
};

module.exports = new Command("serve")
  .description("start a local server for your static assets")
  .option("-p, --port <port>", "the port on which to listen (default: 5000)", 5000)
  .option("-o, --host <host>", "the host on which to listen (default: localhost)", "localhost")
  .option(
    "--firestore-host <hostname>",
    "the hostname the Firestore emulator should bind to (default: 'localhost')",
    "localhost"
  )
  .option(
    "--firestore-port <port>",
    "the port the Firestore emulator should bind to (default: 8080)",
    8080
  )
  .option(
    "--database-host <hostname>",
    "the hostname the Realtime Database emulator should bind to (default: 'localhost')",
    "localhost"
  )
  .option(
    "--database-port <port>",
    "the port the Realtime Database emulator should bind to (default: 9000)",
    9000
  )
  .option(
    "--only <targets>",
    "only serve specified targets (valid targets are: " +
      _.union(VALID_TARGETS, VALID_EMULATORS).join(", ") +
      ")"
  )
  .option(
    "--except <targets>",
    "serve all except specified targets (valid targets are: " + VALID_TARGETS.join(", ") + ")"
  )
  .before((options) => {
    if (filterOnlyEmulators(options.only).length > 0) {
      return Promise.resolve();
    }
    return requireConfig(options)
      .then(() => requirePermissions(options))
      .then(() => checkDupHostingKeys(options))
      .then(() => getProjectNumber(options));
  })
  .action((options) => {
    options.targets = filterOnlyEmulators(options.only);
    if (options.targets.length > 0) {
      return serve(options);
    }
    if (options.config) {
      logger.info();
      logger.info(
        clc.bold(clc.white("===") + " Serving from '" + options.config.projectDir + "'...")
      );
      logger.info();
    } else {
      utils.logWarning(
        "No Firebase project directory detected. Serving static content from " +
          clc.bold(options.cwd || process.cwd())
      );
    }
    options.targets = filterTargets(options, VALID_TARGETS);
    return serve(options);
  });
