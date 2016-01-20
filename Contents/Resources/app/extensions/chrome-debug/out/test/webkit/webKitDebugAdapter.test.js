/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var mockery = require('mockery');
var events_1 = require('events');
var assert = require('assert');
var testUtils = require('../testUtils');
var utils = require('../../webkit/utilities');
var MODULE_UNDER_TEST = '../../webkit/webKitDebugAdapter';
suite('WebKitDebugAdapter', function () {
    var mockWebKitConnection;
    setup(function () {
        testUtils.setupUnhandledRejectionListener();
        mockery.enable({ useCleanCache: true, warnOnReplace: false });
        mockery.registerAllowables([
            MODULE_UNDER_TEST,
            './utilities']);
        // Allow the common/ stuff - almost none of it is actually used but I can't get rid of the requires entirely
        mockery.registerAllowables([
            '../common/debugSession',
            '../common/handles',
            '../common/v8Protocol',
            './v8Protocol',
            './consoleHelper',
            'events']);
        mockery.registerMock('os', { platform: function () { return 'win32'; } });
        testUtils.registerEmptyMocks(['child_process', 'url', 'path', 'net', 'fs', 'http']);
        mockWebKitConnection = testUtils.createRegisteredSinonMock('./webKitConnection', new DefaultMockWebKitConnection(), 'WebKitConnection');
    });
    teardown(function () {
        DefaultMockWebKitConnection.EE.removeAllListeners();
        testUtils.removeUnhandledRejectionListener();
        mockery.deregisterAll();
        mockery.disable();
    });
    suite('attach()', function () {
        test('if successful, an initialized event is fired', function () {
            var wkda = instantiateWKDA();
            var initializedFired = false;
            wkda.registerEventHandler(function (event) {
                if (event.event === 'initialized') {
                    initializedFired = true;
                }
                else {
                    assert.fail('An unexpected event was fired');
                }
            });
            return attach(wkda).then(function () {
                if (!initializedFired) {
                    assert.fail('Attach completed without firing the initialized event');
                }
            });
        });
        test('if unsuccessful, the promise is rejected and an initialized event is not fired', function (done) {
            mockWebKitConnection.expects('attach').returns(utils.errP('Testing attach failed'));
            var wkda = instantiateWKDA();
            wkda.registerEventHandler(function (event) {
                assert.fail('Not expecting any event in this scenario');
            });
            return attach(wkda).then(function () { return assert.fail('Expecting promise to be rejected'); }, function (e) { return done(); });
        });
    });
    suite('setBreakpoints()', function () {
        var BP_ID = 'bpId';
        var FILE_NAME = 'file:///a.js';
        function expectSetBreakpoint(lines, cols, scriptId) {
            if (scriptId === void 0) { scriptId = 'SCRIPT_ID'; }
            lines.forEach(function (lineNumber, i) {
                var columnNumber;
                if (cols) {
                    columnNumber = cols[i];
                }
                mockWebKitConnection.expects('debugger_setBreakpointByUrl')
                    .once()
                    .withArgs(FILE_NAME, lineNumber, columnNumber)
                    .returns({ id: 0, result: { breakpointId: BP_ID + i, locations: [{ scriptId: scriptId, lineNumber: lineNumber, columnNumber: columnNumber }] } });
            });
        }
        function expectRemoveBreakpoint(indicies) {
            indicies.forEach(function (i) {
                mockWebKitConnection.expects('debugger_removeBreakpoint')
                    .once()
                    .withArgs(BP_ID + i)
                    .returns({ id: 0 });
            });
        }
        function makeExpectedResponse(lines, cols) {
            var breakpoints = lines.map(function (line, i) { return ({
                line: line,
                column: cols ? cols[i] : 0,
                verified: true
            }); });
            return {
                breakpoints: breakpoints
            };
        }
        test('When setting one breakpoint, returns the correct result', function () {
            var lines = [5];
            var cols = [6];
            expectSetBreakpoint(lines, cols);
            var wkda = instantiateWKDA();
            return attach(wkda).then(function () {
                return wkda.setBreakpoints({ source: { path: FILE_NAME }, lines: lines, cols: cols });
            }).then(function (response) {
                mockWebKitConnection.verify();
                assert.deepEqual(response, makeExpectedResponse(lines, cols));
            });
        });
        test('When setting multiple breakpoints, returns the correct result', function () {
            var lines = [14, 200, 151];
            var cols = [33, 16, 1];
            expectSetBreakpoint(lines, cols);
            var wkda = instantiateWKDA();
            return attach(wkda).then(function () {
                return wkda.setBreakpoints({ source: { path: FILE_NAME }, lines: lines, cols: cols });
            }).then(function (response) {
                mockWebKitConnection.verify();
                assert.deepEqual(response, makeExpectedResponse(lines, cols));
            });
        });
        test('The adapter clears all previous breakpoints in a script before setting the new ones', function () {
            var lines = [14, 200];
            var cols = [33, 16];
            expectSetBreakpoint(lines, cols);
            var wkda = instantiateWKDA();
            return attach(wkda).then(function () {
                return wkda.setBreakpoints({ source: { path: FILE_NAME }, lines: lines, cols: cols });
            }).then(function (response) {
                lines.push(321);
                cols.push(123);
                expectRemoveBreakpoint([0, 1]);
                expectSetBreakpoint(lines, cols);
                return wkda.setBreakpoints({ source: { path: FILE_NAME }, lines: lines, cols: cols });
            }).then(function (response) {
                mockWebKitConnection.verify();
                assert.deepEqual(response, makeExpectedResponse(lines, cols));
            });
        });
        test('The adapter handles removing a breakpoint', function () {
            var lines = [14, 200];
            var cols = [33, 16];
            expectSetBreakpoint(lines, cols);
            var wkda = instantiateWKDA();
            return attach(wkda).then(function () {
                return wkda.setBreakpoints({ source: { path: FILE_NAME }, lines: lines, cols: cols });
            }).then(function (response) {
                lines.shift();
                cols.shift();
                expectRemoveBreakpoint([0, 1]);
                expectSetBreakpoint(lines, cols);
                return wkda.setBreakpoints({ source: { path: FILE_NAME }, lines: lines, cols: cols });
            }).then(function (response) {
                mockWebKitConnection.verify();
                assert.deepEqual(response, makeExpectedResponse(lines, cols));
            });
        });
        test('After a page refresh, clears the newly resolved breakpoints before adding new ones', function () {
            var lines = [14, 200];
            var cols = [33, 16];
            expectSetBreakpoint(lines, cols);
            var wkda = instantiateWKDA();
            return attach(wkda).then(function () {
                return wkda.setBreakpoints({ source: { path: FILE_NAME }, lines: lines, cols: cols });
            }).then(function (response) {
                expectRemoveBreakpoint([2, 3]);
                DefaultMockWebKitConnection.EE.emit('Debugger.globalObjectCleared');
                DefaultMockWebKitConnection.EE.emit('Debugger.scriptParsed', { scriptId: 'afterRefreshScriptId', url: FILE_NAME });
                DefaultMockWebKitConnection.EE.emit('Debugger.breakpointResolved', { breakpointId: BP_ID + 2, location: { scriptId: 'afterRefreshScriptId' } });
                DefaultMockWebKitConnection.EE.emit('Debugger.breakpointResolved', { breakpointId: BP_ID + 3, location: { scriptId: 'afterRefreshScriptId' } });
                lines.push(321);
                cols.push(123);
                expectSetBreakpoint(lines, cols, 'afterRefreshScriptId');
                return wkda.setBreakpoints({ source: { path: FILE_NAME }, lines: lines, cols: cols });
            }).then(function (response) {
                mockWebKitConnection.verify();
                assert.deepEqual(response, makeExpectedResponse(lines, cols));
            });
        });
    });
    suite('launch()', function () {
        test('launches with minimal correct args', function () {
            var spawnCalled = false;
            function spawn(chromePath, args) {
                // Just assert that the chrome path is some string with 'chrome' in the path, and there are >0 args
                assert(chromePath.toLowerCase().indexOf('chrome') >= 0);
                assert(args.indexOf('--remote-debugging-port=9222') >= 0);
                assert(args.indexOf('file:///c:/a.js') >= 0);
                assert(args.indexOf('abc') >= 0);
                assert(args.indexOf('def') >= 0);
                spawnCalled = true;
                return { on: function () { }, unref: function () { } };
            }
            // actual path.resolve returns system-dependent slashes
            mockery.registerMock('path', { resolve: function (a, b) { return a + b; } });
            mockery.registerMock('child_process', { spawn: spawn });
            mockery.registerMock('fs', { statSync: function () { return true; } });
            mockery.registerMock('os', {
                tmpdir: function () { return 'c:/tmp'; },
                platform: function () { return 'win32'; }
            });
            var wkda = instantiateWKDA();
            return wkda.launch({ file: 'a.js', runtimeArgs: ['abc', 'def'], cwd: 'c:/' }).then(function () {
                assert(spawnCalled);
            });
        });
    });
    suite('Console.onMessageAdded', function () {
        test('Fires an output event when a console message is added', function () {
            var testLog = 'Hello, world!';
            var wkda = instantiateWKDA();
            var outputEventFired = false;
            wkda.registerEventHandler(function (event) {
                if (event.event === 'output') {
                    outputEventFired = true;
                    assert.equal(event.body.text, testLog);
                }
                else {
                    assert.fail('An unexpected event was fired');
                }
            });
            DefaultMockWebKitConnection.EE.emit('Console.onMessageAdded', {
                message: {
                    source: 'console-api',
                    level: 'log',
                    type: 'log',
                    text: testLog,
                    timestamp: Date.now(),
                    line: 2,
                    column: 13,
                    url: 'file:///c:/page/script.js',
                    executionContextId: 2,
                    parameters: [
                        { type: 'string', value: testLog }
                    ]
                }
            });
        });
    });
    suite('setExceptionBreakpoints()', function () { });
    suite('stepping', function () { });
    suite('stackTrace()', function () { });
    suite('scopes()', function () { });
    suite('variables()', function () { });
    suite('source()', function () { });
    suite('threads()', function () { });
    suite('evaluate()', function () { });
    suite('Debugger.resume', function () { });
    suite('Debugger.pause', function () { });
    suite('target close/error/detach', function () { });
});
function attach(wkda) {
    return wkda.attach({ port: 9222, cwd: 'c:/' });
}
var DefaultMockWebKitConnection = (function () {
    function DefaultMockWebKitConnection() {
    }
    DefaultMockWebKitConnection.prototype.on = function (eventName, handler) {
        DefaultMockWebKitConnection.EE.on(eventName, handler);
    };
    DefaultMockWebKitConnection.prototype.attach = function (port) {
        return Promise.resolve();
    };
    DefaultMockWebKitConnection.EE = new events_1.EventEmitter();
    return DefaultMockWebKitConnection;
})();
function instantiateWKDA() {
    var WebKitDebugAdapter = require(MODULE_UNDER_TEST).WebKitDebugAdapter;
    return new WebKitDebugAdapter();
}

//# sourceMappingURL=webKitDebugAdapter.test.js.map
