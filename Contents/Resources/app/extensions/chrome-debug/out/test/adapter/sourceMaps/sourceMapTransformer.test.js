/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var assert = require('assert');
var mockery = require('mockery');
var testUtils = require('../../testUtils');
var MODULE_UNDER_TEST = '../../../adapter/sourceMaps/sourceMapTransformer';
var AUTHORED_PATH = 'c:/project/authored.ts';
var RUNTIME_PATH = 'c:/project/runtime.js';
var AUTHORED_LINES = [1, 2, 3];
var RUNTIME_LINES = [2, 5, 8];
var RUNTIME_COLS = [3, 7, 11];
var AUTHORED_PATH2 = 'c:/project/authored2.ts';
var AUTHORED_LINES2 = [90, 105];
var RUNTIME_LINES2 = [78, 81];
var RUNTIME_COLS2 = [0, 1];
suite('SourceMapTransformer', function () {
    var utilsMock;
    setup(function () {
        testUtils.setupUnhandledRejectionListener();
        // Set up mockery
        mockery.enable({ warnOnReplace: false, useCleanCache: true });
        utilsMock = testUtils.createRegisteredSinonMock('../../webkit/utilities', testUtils.getDefaultUtilitiesMock());
        mockery.registerAllowables([MODULE_UNDER_TEST, 'path']);
    });
    teardown(function () {
        testUtils.removeUnhandledRejectionListener();
        mockery.deregisterAll();
        mockery.disable();
    });
    function getTransformer(sourceMaps, suppressDefaultMock) {
        if (sourceMaps === void 0) { sourceMaps = true; }
        if (suppressDefaultMock === void 0) { suppressDefaultMock = false; }
        if (!suppressDefaultMock) {
            mockery.registerMock('./sourceMaps', { SourceMaps: StubSourceMaps });
        }
        var SourceMapTransformer = require(MODULE_UNDER_TEST).SourceMapTransformer;
        var transformer = new SourceMapTransformer();
        transformer.launch({
            sourceMaps: sourceMaps,
            generatedCodeDirectory: 'test'
        });
        return transformer;
    }
    suite('setBreakpoints()', function () {
        function createArgs(path, lines, cols) {
            return {
                source: { path: path },
                lines: lines,
                cols: cols
            };
        }
        function createExpectedArgs(authoredPath, path, lines, cols) {
            var args = createArgs(path, lines, cols);
            args.authoredPath = authoredPath;
            return args;
        }
        function createMergedSourcesMock(args, args2) {
            var mock = testUtils.createRegisteredSinonMock('./sourceMaps', undefined, 'SourceMaps');
            mock.expects('MapPathFromSource')
                .withExactArgs(AUTHORED_PATH).returns(RUNTIME_PATH);
            mock.expects('MapPathFromSource')
                .withExactArgs(AUTHORED_PATH2).returns(RUNTIME_PATH);
            mock.expects('AllMappedSources')
                .twice()
                .withExactArgs(RUNTIME_PATH).returns([AUTHORED_PATH, AUTHORED_PATH2]);
            args.lines.forEach(function (line, i) {
                mock.expects('MapFromSource')
                    .withExactArgs(AUTHORED_PATH, line, 0)
                    .returns({ path: RUNTIME_PATH, line: RUNTIME_LINES[i], column: RUNTIME_COLS[i] });
            });
            args2.lines.forEach(function (line, i) {
                mock.expects('MapFromSource')
                    .withExactArgs(AUTHORED_PATH2, line, 0)
                    .returns({ path: RUNTIME_PATH, line: RUNTIME_LINES2[i], column: RUNTIME_COLS2[i] });
            });
            return mock;
        }
        test('modifies the source and lines', function () {
            var args = createArgs(AUTHORED_PATH, AUTHORED_LINES);
            var expected = createExpectedArgs(AUTHORED_PATH, RUNTIME_PATH, RUNTIME_LINES, RUNTIME_COLS);
            return getTransformer().setBreakpoints(args, 0).then(function () {
                assert.deepEqual(args, expected);
            });
        });
        test("doesn't do anything when sourcemaps are disabled", function () {
            var args = createArgs(RUNTIME_PATH, RUNTIME_LINES);
            var expected = createArgs(RUNTIME_PATH, RUNTIME_LINES);
            return getTransformer(false).setBreakpoints(args, 0).then(function () {
                assert.deepEqual(args, expected);
            });
        });
        test("if the source can't be mapped, waits until the runtime script is loaded", function () {
            var args = createArgs(AUTHORED_PATH, AUTHORED_LINES);
            var expected = createExpectedArgs(AUTHORED_PATH, RUNTIME_PATH, RUNTIME_LINES, RUNTIME_COLS);
            var mock = testUtils.createRegisteredSinonMock('./sourceMaps', undefined, 'SourceMaps');
            mock.expects('MapPathFromSource')
                .withExactArgs(AUTHORED_PATH).returns(null);
            mock.expects('MapPathFromSource')
                .withExactArgs(AUTHORED_PATH).returns(RUNTIME_PATH);
            mock.expects('AllMappedSources')
                .twice()
                .withExactArgs(RUNTIME_PATH).returns([AUTHORED_PATH]);
            mock.expects('ProcessNewSourceMap')
                .withExactArgs(RUNTIME_PATH, 'script.js.map').returns(Promise.resolve());
            args.lines.forEach(function (line, i) {
                mock.expects('MapFromSource')
                    .withExactArgs(AUTHORED_PATH, line, 0)
                    .returns({ path: RUNTIME_PATH, line: RUNTIME_LINES[i], column: RUNTIME_COLS[i] });
            });
            var transformer = getTransformer(true, true);
            var setBreakpointsP = transformer.setBreakpoints(args, 0).then(function () {
                assert.deepEqual(args, expected);
                mock.verify();
            });
            transformer.scriptParsed(new testUtils.MockEvent('scriptParsed', { scriptUrl: RUNTIME_PATH, sourceMapURL: 'script.js.map' }));
            return setBreakpointsP;
        });
        test('if the source maps to a merged file, includes the breakpoints in other files that map to the same file', function () {
            var args = createArgs(AUTHORED_PATH, AUTHORED_LINES);
            var args2 = createArgs(AUTHORED_PATH2, AUTHORED_LINES2);
            var expected = createExpectedArgs(AUTHORED_PATH2, RUNTIME_PATH, RUNTIME_LINES2.concat(RUNTIME_LINES), RUNTIME_COLS2.concat(RUNTIME_COLS));
            var mock = createMergedSourcesMock(args, args2);
            var transformer = getTransformer(true, true);
            return transformer.setBreakpoints(args, 0).then(function () {
                return transformer.setBreakpoints(args2, 1);
            }).then(function () {
                assert.deepEqual(args2, expected);
                mock.verify();
            });
        });
        suite('setBreakpointsResponse()', function () {
            function getResponseBody(lines, column) {
                return {
                    breakpoints: lines.map(function (line) {
                        var bp = { line: line, verified: true };
                        if (column !== undefined) {
                            bp.column = column;
                        }
                        return bp;
                    })
                };
            }
            test('modifies the response source and lines', function () {
                var response = getResponseBody(RUNTIME_LINES, /*column=*/ 0);
                var expected = getResponseBody(AUTHORED_LINES);
                var transformer = getTransformer();
                transformer.setBreakpoints({
                    source: { path: AUTHORED_PATH },
                    lines: AUTHORED_LINES
                }, 0);
                transformer.setBreakpointsResponse(response, 0);
                assert.deepEqual(response, expected);
            });
            test("doesn't do anything when sourcemaps are disabled except remove the column", function () {
                var response = getResponseBody(RUNTIME_LINES, /*column=*/ 0);
                var expected = getResponseBody(RUNTIME_LINES);
                var transformer = getTransformer(false);
                transformer.setBreakpoints({
                    source: { path: RUNTIME_PATH },
                    lines: RUNTIME_LINES
                }, 0);
                transformer.setBreakpointsResponse(response, 0);
                assert.deepEqual(response, expected);
            });
            test("if the source maps to a merged file, filters breakpoint results from other files", function () {
                var setBPArgs = createArgs(AUTHORED_PATH, AUTHORED_LINES);
                var setBPArgs2 = createArgs(AUTHORED_PATH2, AUTHORED_LINES2);
                var response = getResponseBody(RUNTIME_LINES2.concat(RUNTIME_LINES), /*column=*/ 0);
                var expected = getResponseBody(AUTHORED_LINES2);
                var mock = createMergedSourcesMock(setBPArgs, setBPArgs2);
                RUNTIME_LINES2.forEach(function (line, i) {
                    mock.expects('MapToSource')
                        .withExactArgs(RUNTIME_PATH, line, 0)
                        .returns({ path: AUTHORED_PATH2, line: AUTHORED_LINES2[i] });
                });
                var transformer = getTransformer(true, true);
                return transformer.setBreakpoints(setBPArgs, 0).then(function () {
                    return transformer.setBreakpoints(setBPArgs2, 1);
                }).then(function () {
                    transformer.setBreakpointsResponse(response, 1);
                    assert.deepEqual(response, expected);
                    mock.verify();
                });
            });
        });
    });
    suite('stackTraceResponse()', function () {
        test('modifies the response stackFrames', function () {
            utilsMock.expects('existsSync')
                .thrice()
                .withExactArgs(AUTHORED_PATH).returns(true);
            var response = testUtils.getStackTraceResponseBody(RUNTIME_PATH, RUNTIME_LINES, [1, 2, 3]);
            var expected = testUtils.getStackTraceResponseBody(AUTHORED_PATH, AUTHORED_LINES);
            getTransformer().stackTraceResponse(response);
            assert.deepEqual(response, expected);
        });
        test('clears the path when there are no sourcemaps', function () {
            var response = testUtils.getStackTraceResponseBody(RUNTIME_PATH, RUNTIME_LINES, [1, 2, 3]);
            var expected = testUtils.getStackTraceResponseBody(RUNTIME_PATH, RUNTIME_LINES, [1, 2, 3]);
            expected.stackFrames.forEach(function (stackFrame) { return stackFrame.source.path = undefined; }); // leave name intact
            getTransformer(false).stackTraceResponse(response);
            assert.deepEqual(response, expected);
        });
        test("keeps the path when the file can't be sourcemapped if it's on disk", function () {
            var mock = testUtils.createRegisteredSinonMock('./sourceMaps', undefined, 'SourceMaps');
            RUNTIME_LINES.forEach(function (line) {
                mock.expects('MapToSource')
                    .withExactArgs(RUNTIME_PATH, line, 0).returns(null);
            });
            utilsMock.expects('existsSync')
                .thrice()
                .withExactArgs(RUNTIME_PATH).returns(true);
            var response = testUtils.getStackTraceResponseBody(RUNTIME_PATH, RUNTIME_LINES, [1, 2, 3]);
            var expected = testUtils.getStackTraceResponseBody(RUNTIME_PATH, RUNTIME_LINES);
            getTransformer(true, true).stackTraceResponse(response);
            assert.deepEqual(response, expected);
        });
        test("clears the path when it can't be sourcemapped and doesn't exist on disk", function () {
            var mock = testUtils.createRegisteredSinonMock('./sourceMaps', undefined, 'SourceMaps');
            RUNTIME_LINES.forEach(function (line) {
                mock.expects('MapToSource')
                    .withExactArgs(RUNTIME_PATH, line, 0).returns(null);
            });
            utilsMock.expects('existsSync')
                .thrice()
                .withExactArgs(RUNTIME_PATH).returns(false);
            var response = testUtils.getStackTraceResponseBody(RUNTIME_PATH, RUNTIME_LINES, [1, 2, 3]);
            var expected = testUtils.getStackTraceResponseBody(RUNTIME_PATH, RUNTIME_LINES, [1, 2, 3]);
            expected.stackFrames.forEach(function (stackFrame) { return stackFrame.source.path = undefined; }); // leave name intact
            getTransformer(true, true).stackTraceResponse(response);
            assert.deepEqual(response, expected);
        });
    });
});
var StubSourceMaps = (function () {
    function StubSourceMaps(generatedCodeDirectory) {
        this.generatedCodeDirectory = generatedCodeDirectory;
    }
    StubSourceMaps.prototype.MapPathFromSource = function (path) {
        return RUNTIME_PATH;
    };
    /*
     * Map location in source language to location in generated code.
     * line and column are 0 based.
     */
    StubSourceMaps.prototype.MapFromSource = function (path, line, column) {
        var index = AUTHORED_LINES.indexOf(line);
        var mappedLine = RUNTIME_LINES[index];
        var mappedCol = RUNTIME_COLS[index];
        return { path: RUNTIME_PATH, line: mappedLine, column: mappedCol };
    };
    /*
     * Map location in generated code to location in source language.
     * line and column are 0 based.
     */
    StubSourceMaps.prototype.MapToSource = function (path, line, column) {
        var mappedLine = AUTHORED_LINES[RUNTIME_LINES.indexOf(line)];
        return { path: AUTHORED_PATH, line: mappedLine, column: 0 };
    };
    StubSourceMaps.prototype.AllMappedSources = function (pathToGenerated) {
        return [AUTHORED_PATH];
    };
    StubSourceMaps.prototype.ProcessNewSourceMap = function (pathToGenerated, sourceMapURL) {
        return Promise.resolve();
    };
    return StubSourceMaps;
}());

//# sourceMappingURL=sourceMapTransformer.test.js.map
