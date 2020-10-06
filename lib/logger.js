const winston = require('winston');
const moment = require('moment');


module.exports = function (instanceName, moduleName, methodName) {
    const {PLANT_LOG_LEVEL, LOG_LEVEL, PLANT_LOG_TIMESTAMP} = process.env;
    const strLevel= PLANT_LOG_LEVEL || LOG_LEVEL || 'error';

    const formatter = (options) => {
        const {req= '', usr = '', own = ''} = options.meta || {};
        return `${PLANT_LOG_TIMESTAMP ? options.timestamp()+' ' : ''}${instanceName} ${options.level.toUpperCase()} [${moduleName}.${methodName}] [${req }] [${usr}] [${own}] ${options.message || ''}`
    };

    return new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level: strLevel.toLowerCase(),
                timestamp: () => { return moment().toISOString() },
                formatter,
                stderrLevels: ['error']
            })
        ]
    })
};
