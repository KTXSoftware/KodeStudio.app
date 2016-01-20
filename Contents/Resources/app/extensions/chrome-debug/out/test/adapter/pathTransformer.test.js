/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var assert = require('assert');
var mockery = require('mockery');
var testUtils = require('../testUtils');
var MODULE_UNDER_TEST = '../../adapter/pathTransformer';
function createTransformer() {
    return new (require(MODULE_UNDER_TEST).PathTransformer)();
}
suite('PathTransformer', function () {
    var TARGET_URL = 'http://mysite.com/scripts/script1.js';
    var CLIENT_PATH = 'c:/projects/mysite/scripts/script1.js';
    var utilsMock;
    var transformer;
    setup(function () {
        testUtils.setupUnhandledRejectionListener();
        mockery.enable({ useCleanCache: true, warnOnReplace: false });
        mockery.registerAllowables([MODULE_UNDER_TEST, 'path']);
        // Mock the utils functions
        utilsMock = testUtils.createRegisteredSinonMock('../webkit/utilities', testUtils.getDefaultUtilitiesMock());
        transformer = createTransformer();
    });
    teardown(function () {
        testUtils.removeUnhandledRejectionListener();
        mockery.deregisterAll();
        mockery.disable();
    });
    suite('setBreakpoints()', function () {
        var SET_BP_ARGS;
        var EXPECTED_SET_BP_ARGS = { source: { path: TARGET_URL } };
        setup(function () {
            // This will be modified by the test, so restore it before each
            SET_BP_ARGS = { source: { path: CLIENT_PATH } };
        });
        test('resolves correctly when it can map the client script to the target script', function () {
            utilsMock.expects('webkitUrlToClientPath')
                .withExactArgs(/*webRoot=*/ undefined, TARGET_URL).returns(CLIENT_PATH);
            utilsMock.expects('canonicalizeUrl')
                .returns(CLIENT_PATH);
            utilsMock.expects('isURL')
                .withExactArgs(CLIENT_PATH).returns(false);
            transformer.scriptParsed({ body: { scriptUrl: TARGET_URL } });
            return transformer.setBreakpoints(SET_BP_ARGS).then(function () {
                utilsMock.verify();
                assert.deepEqual(SET_BP_ARGS, EXPECTED_SET_BP_ARGS);
            });
        });
        test("doesn't resolve until it can map the client script to the target script", function () {
            utilsMock.expects('webkitUrlToClientPath')
                .withExactArgs(/*webRoot=*/ undefined, TARGET_URL).returns(CLIENT_PATH);
            utilsMock.expects('canonicalizeUrl')
                .twice()
                .returns(CLIENT_PATH);
            utilsMock.expects('isURL')
                .twice()
                .withArgs(CLIENT_PATH).returns(false);
            var setBreakpointsP = transformer.setBreakpoints(SET_BP_ARGS).then(function () {
                // If this assert doesn't fail, we know that it resolved at the right time because otherwise it would have no
                // way to produce args with the right url
                utilsMock.verify();
                assert.deepEqual(SET_BP_ARGS, EXPECTED_SET_BP_ARGS);
            });
            transformer.scriptParsed({ body: { scriptUrl: TARGET_URL } });
            return setBreakpointsP;
        });
        test("uses path as-is when it's a URL", function () {
            utilsMock.expects('isURL')
                .withExactArgs(TARGET_URL).returns(true);
            var args = { source: { path: TARGET_URL } };
            return transformer.setBreakpoints(args).then(function () {
                utilsMock.verify();
                assert.deepEqual(args, EXPECTED_SET_BP_ARGS);
            });
        });
    });
    suite('scriptParsed', function () {
        test('modifies args.source.path of the script parsed event when the file can be mapped', function () {
            utilsMock.expects('webkitUrlToClientPath')
                .withExactArgs(/*webRoot=*/ undefined, TARGET_URL).returns(CLIENT_PATH);
            var scriptParsedArgs = { body: { scriptUrl: TARGET_URL } };
            var expectedScriptParsedArgs = { body: { scriptUrl: CLIENT_PATH } };
            transformer.scriptParsed(scriptParsedArgs);
            assert.deepEqual(scriptParsedArgs, expectedScriptParsedArgs);
        });
        test("doesn't modify args.source.path when the file can't be mapped", function () {
            utilsMock.expects('webkitUrlToClientPath')
                .withExactArgs(/*webRoot=*/ undefined, TARGET_URL).returns('');
            var scriptParsedArgs = { body: { scriptUrl: TARGET_URL } };
            var expectedScriptParsedArgs = { body: { scriptUrl: TARGET_URL } };
            transformer.scriptParsed(scriptParsedArgs);
            assert.deepEqual(scriptParsedArgs, expectedScriptParsedArgs);
        });
    });
    suite('stackTraceResponse()', function () {
        var RUNTIME_LINES = [2, 5, 8];
        test('modifies the source path and clears sourceReference when the file can be mapped', function () {
            utilsMock.expects('webkitUrlToClientPath')
                .thrice()
                .withExactArgs(undefined, TARGET_URL).returns(CLIENT_PATH);
            var response = testUtils.getStackTraceResponseBody(TARGET_URL, RUNTIME_LINES, [1, 2, 3]);
            var expectedResponse = testUtils.getStackTraceResponseBody(CLIENT_PATH, RUNTIME_LINES);
            transformer.stackTraceResponse(response);
            assert.deepEqual(response, expectedResponse);
        });
        test("doesn't modify the source path or clear the sourceReference when the file can't be mapped", function () {
            utilsMock.expects('webkitUrlToClientPath')
                .thrice()
                .withExactArgs(undefined, TARGET_URL).returns('');
            var response = testUtils.getStackTraceResponseBody(TARGET_URL, RUNTIME_LINES, [1, 2, 3]);
            var expectedResponse = testUtils.getStackTraceResponseBody(TARGET_URL, RUNTIME_LINES, [1, 2, 3]);
            transformer.stackTraceResponse(response);
            assert.deepEqual(response, expectedResponse);
        });
    });
});

//# sourceMappingURL=pathTransformer.test.js.map
