const assert = require('assert');


module.exports = async (plant, logger) => {

    plant.on('test', () =>{
        const alpha = plant.module('alpha');
        const bravo = plant.module('bravo');
        assert(alpha.methodA);
        assert(bravo.methodA);
        logger.error('subsC called');
    })
};
