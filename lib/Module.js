const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const forEach = require('lodash').forEach;

const logger = require('./logger');
const errorWrapper = require('./errorWrapper');

const wrapMethod = (fn, plant, logger) => {
    return async (...params) => {
        const context = {plant, logger};
        return Promise.resolve(fn.call(context, ...params))
            .catch(error => {
                if (error) logger.error(error instanceof Error ? error.message : error);
                throw error;
            });
    };
};

module.exports = class extends EventEmitter {

    constructor(moduleName, modulePath, plant) {
        super();

        const module = this;
        module._loggers = [];
        const methodFiles = fs.readdirSync(modulePath);
        forEach(methodFiles, (methodFilename) => {
            const methodName = path.basename(methodFilename, '.js');
            if (methodName === 'test') return;
            const requirePath = path.join(modulePath, methodFilename);
            if (fs.lstatSync(requirePath).isDirectory()) return;
            let wrapper = require(requirePath);
            if (Object.getPrototypeOf(wrapper).constructor.name !== 'AsyncFunction') {
                throw new Error(`Method ${moduleName}.${methodName} is not an async function`);
            }
            const cLogger = logger(plant.name, moduleName, methodName);
            module._loggers.push(cLogger);
            module[methodName] = wrapMethod(wrapper, plant, cLogger);
        });
    }

    /**
     * Set external function should be called for each error logged
     *  called from main class
     *
     * @param {Function} fErrorHandler
     * @private
     */
    setErrorHandler(fErrorHandler) {
        if (typeof fErrorHandler !== 'function') throw new Error('fErrorHandler is not a function');
        this._loggers.forEach(logger => errorWrapper(logger, fErrorHandler));
    }

    /**
     * It will change loglevel at runtime
     * We use winston.transports.Console for now @see logger.js
     *
     * @param {String} strNewLevel - 'debug', 'error'
     */
    changeLogLevel(strNewLevel) {
        this._loggers.forEach(logger => logger.transports.console.level = strNewLevel);
    }
};
