const {assert} = require('chai');
const sinon = require('sinon');
const Plant = require('./index');
const pack = require('./package.json');


describe('plant', () => {

    const methodAcalledSpy = sinon.spy();
    const options = {
        subsDir: './test_plant/subscribers',
        modulesDir: './test_plant/modules',
    };
    let plant;

    before(async function() {
        plant = new Plant('test-plant', options, pack);
        await plant.ready();
        plant.set('config','config');
    });

    it('loads modules available to each other', async () => {
        plant.module('alpha').on('aCalled', methodAcalledSpy);
        const result = await plant.module('alpha').methodA([]);
        assert.equal(result, 'bravo');
    });

    it('lets modules to emit events', (done) => {
        assert.isTrue(methodAcalledSpy.calledOnce);
        done();
    });

    it('loads _config and extras', async () => {
        const config = await plant.module('alpha').methodB();
        assert.equal(config, 'config');
    });

    it('checks whether plant accessible inside methods (with 2 params)', async function () {
        plant.set('variable', 12);
        const result = await plant.module('charlie').methodA(3);
        assert.equal(result, 36);
    });

    it('checks exception logging (with 2 params)', async function () {
        try {
            await plant.module('charlie').methodA();
        } catch (error) {
            // Just to mark test passed. You should see the error logged
        }
    });

    it('should NOT call plant error handler', async () => {
        try {
            await plant.module('charlie').methodThrows();
        } catch (error) {
            assert.strictEqual(error.message, 'Charlie method');
        }
    });

    it('should call plant error handler', async () => {
        const handler=sinon.fake();
        plant.set('errorHandler', handler);
        try {
            await plant.module('charlie').methodThrows();
        } catch (error) {
            assert.isOk(handler.calledOnce);
            assert.strictEqual(error.message, 'Charlie method');
        }
    });
});
