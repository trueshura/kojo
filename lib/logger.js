const winston = require('winston');
const moment = require('moment');


module.exports = function (instanceName, moduleName, methodName) {
    const {PLANT_LOG_LEVEL, LOG_LEVEL, PLANT_LOG_TIMESTAMP} = process.env;

    const formatter = (options) => {
        const {req, usr, own} = options.meta;
        return `${PLANT_LOG_TIMESTAMP ? options.timestamp()+' ' : ''}${instanceName} ${options.level.toUpperCase()} [${moduleName}.${methodName}] [${req ? req:''}] [${usr? usr:''}] [${own ? own:''}] ${options.message || ''}`
    };

    return new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level: PLANT_LOG_LEVEL || LOG_LEVEL || 'info',
                timestamp: () => { return moment().toISOString() },
                formatter,
                stderrLevels: ['error']
            })
        ]
    })
};
