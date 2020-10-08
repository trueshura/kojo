const path = require('path');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const {promisify} = require('util');
const merge = require('lodash/merge');
const shortid = require('shortid');
const forEach = require('lodash/forEach');
const Module = require('./lib/Module');
const logger = require('./lib/logger');
const errorWrapper = require('./lib/errorWrapper');

const readDir = promisify(fs.readdir);

module.exports = class extends EventEmitter {

    constructor(name, options, packageInfo = {}) {
        super();
        const defaults = {
            subsDir: 'subscribers',
            modulesDir: 'modules'
        };
        const plant = this;
        plant.id = shortid.generate();
        plant.name = name;
        plant._config = options ? merge(defaults, options) : defaults;
        plant._extras = {};
        plant._modules = {};
        plant._packageInfo = packageInfo;
        plant._subscribers = [];
        plant._subsLoggers = [];
    }

    async ready() {

        const plant = this;

        process.stdout.write('  ☢ loading modules...');
        const modulesDir = path.join(process.cwd(), plant._config.modulesDir);
        const moduleDirs = await readDir(modulesDir);
        forEach(moduleDirs, (moduleDir) => {
            const modulePath = path.join(modulesDir, moduleDir);
            if (!fs.lstatSync(modulePath).isDirectory()) return;
            const moduleName = path.basename(modulePath);
            plant._modules[moduleName] = new Module(moduleName, modulePath, plant);
        });
        console.log('done');

        process.stdout.write('  ☢ loading subscribers...');
        const subsDir = path.join(process.cwd(), plant._config.subsDir);
        const subscriberFiles = await readDir(subsDir);
        forEach(subscriberFiles, (subscriberFile) => {
            const subName = path.basename(subscriberFile, '.js');
            const requirePath = path.join(subsDir, subscriberFile);
            plant._subscribers.push(subName);
            const subsWrapper = require(requirePath);

            const cLogger = logger(plant.name, 'sub', subName);
            plant._subsLoggers.push(cLogger);
            subsWrapper(plant, cLogger);
        });
        process.stdout.write('done\n');
    }

    set(key, value) {
        this._extras[key] = value;
    }

    get(key) {
        return this._extras[key];
    }

    module(name) {
        if (!this._modules[name]) throw new Error(`module '${name}' is either not loaded yet or unknown`);
        return this._modules[name];
    }

    /**
     * Allow to call external function every time when logger.error triggered
     *
     * @param {Function} fErrorHandler
     */
    setErrorHandler(fErrorHandler) {
        if (typeof fErrorHandler !== 'function') throw new Error('fErrorHandler is not a function');

        this._subsLoggers.forEach(logger => errorWrapper(logger, fErrorHandler));
        Object.keys(this._modules).forEach(moduleName => this.module(moduleName).setErrorHandler(fErrorHandler));
    }

    /**
     * Change all loggers logLevel at runtime
     *
     * @param {String} strNewLevel
     */
    changeLogLevel(strNewLevel) {
        this._subsLoggers.forEach(logger => logger.transports.console.level = strNewLevel);
        Object.keys(this._modules).forEach(moduleName => this.module(moduleName).changeLogLevel(strNewLevel));
    }
};
