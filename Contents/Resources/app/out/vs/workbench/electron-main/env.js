/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'crypto', 'fs', 'path', 'os', 'electron', 'vs/base/common/arrays', 'vs/base/common/strings', 'vs/base/common/paths', 'vs/base/common/platform', 'vs/base/common/uri', 'vs/base/common/types'], function (require, exports, crypto, fs, path, os, electron_1, arrays, strings, paths, platform, uri_1, types) {
    exports.isBuilt = !process.env.VSCODE_DEV;
    exports.appRoot = path.dirname(uri_1.default.parse(require.toUrl('')).fsPath);
    var productContents;
    try {
        productContents = JSON.parse(fs.readFileSync(path.join(exports.appRoot, 'product.json'), 'utf8'));
    }
    catch (error) {
        productContents = Object.create(null);
    }
    exports.product = productContents;
    exports.product.nameShort = exports.product.nameShort || 'Code [OSS Build]';
    exports.product.nameLong = exports.product.nameLong || 'Code [OSS Build]';
    exports.product.dataFolderName = exports.product.dataFolderName || (exports.isBuilt ? '.code-oss-build' : '.code-oss-build-dev');
    exports.updateInfo = exports.product.updateUrl ? { baseUrl: exports.product.updateUrl } : void 0;
    exports.mainIPCHandle = getMainIPCHandle();
    exports.sharedIPCHandle = getSharedIPCHandle();
    exports.version = electron_1.app.getVersion();
    exports.cliArgs = parseCli();
    exports.appHome = electron_1.app.getPath('userData');
    exports.appSettingsHome = path.join(exports.appHome, 'User');
    if (!fs.existsSync(exports.appSettingsHome)) {
        fs.mkdirSync(exports.appSettingsHome);
    }
    exports.appSettingsPath = path.join(exports.appSettingsHome, 'settings.json');
    exports.appKeybindingsPath = path.join(exports.appSettingsHome, 'keybindings.json');
    exports.userHome = path.join(electron_1.app.getPath('home'), exports.product.dataFolderName);
    if (!fs.existsSync(exports.userHome)) {
        fs.mkdirSync(exports.userHome);
    }
    exports.userPluginsHome = exports.cliArgs.pluginHomePath || path.join(exports.userHome, 'extensions');
    if (!fs.existsSync(exports.userPluginsHome)) {
        fs.mkdirSync(exports.userPluginsHome);
    }
    // Helper to identify if we have plugin tests to run from the command line without debugger
    exports.isTestingFromCli = exports.cliArgs.pluginTestsPath && !exports.cliArgs.debugBrkPluginHost;
    function log() {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i - 0] = arguments[_i];
        }
        if (exports.cliArgs.verboseLogging) {
            console.log.apply(null, a);
        }
    }
    exports.log = log;
    function parseCli() {
        // We need to do some argv massaging. First, remove the Electron executable
        var args = Array.prototype.slice.call(process.argv, 1);
        // Then, when in dev, remove the first non option argument, it will be the app location
        if (!exports.isBuilt) {
            var i = (function () {
                for (var j = 0; j < args.length; j++) {
                    if (args[j][0] !== '-') {
                        return j;
                    }
                }
                return -1;
            })();
            if (i > -1) {
                args.splice(i, 1);
            }
        }
        // Finally, any extra arguments in the 'argv' file should be prepended
        if (fs.existsSync(path.join(exports.appRoot, 'argv'))) {
            var extraargs = JSON.parse(fs.readFileSync(path.join(exports.appRoot, 'argv'), 'utf8'));
            args = extraargs.concat(args);
        }
        var opts = parseOpts(args);
        var gotoLineMode = !!opts['g'] || !!opts['goto'];
        var debugBrkPluginHostPort = parseNumber(args, '--debugBrkPluginHost', 5870);
        var debugPluginHostPort;
        var debugBrkPluginHost;
        if (debugBrkPluginHostPort) {
            debugPluginHostPort = debugBrkPluginHostPort;
            debugBrkPluginHost = true;
        }
        else {
            debugPluginHostPort = parseNumber(args, '--debugPluginHost', 5870, exports.isBuilt ? void 0 : 5870);
        }
        return {
            pathArguments: parsePathArguments(args, gotoLineMode),
            programStart: parseNumber(args, '--timestamp', 0, 0),
            workers: parseNumber(args, '--workers', -1, -1),
            enablePerformance: !!opts['p'],
            verboseLogging: !!opts['verbose'],
            debugPluginHostPort: debugPluginHostPort,
            debugBrkPluginHost: debugBrkPluginHost,
            logPluginHostCommunication: !!opts['logPluginHostCommunication'],
            firstrun: !!opts['squirrel-firstrun'],
            openNewWindow: !!opts['n'] || !!opts['new-window'],
            openInSameWindow: !!opts['r'] || !!opts['reuse-window'],
            gotoLineMode: gotoLineMode,
            pluginHomePath: normalizePath(parseString(args, '--extensionHomePath')),
            pluginDevelopmentPath: normalizePath(parseString(args, '--extensionDevelopmentPath')),
            pluginTestsPath: normalizePath(parseString(args, '--extensionTestsPath')),
            disablePlugins: !!opts['disableExtensions'] || !!opts['disable-extensions']
        };
    }
    function getIPCHandleName() {
        var handleName = electron_1.app.getName();
        if (!exports.isBuilt) {
            handleName += '-dev';
        }
        // Support to run VS Code multiple times as different user
        // by making the socket unique over the logged in user
        var userId = uniqueUserId();
        if (userId) {
            handleName += ('-' + userId);
        }
        if (process.platform === 'win32') {
            return '\\\\.\\pipe\\' + handleName;
        }
        return path.join(os.tmpdir(), handleName);
    }
    function getMainIPCHandle() {
        return getIPCHandleName() + (process.platform === 'win32' ? '-sock' : '.sock');
    }
    function getSharedIPCHandle() {
        return getIPCHandleName() + '-shared' + (process.platform === 'win32' ? '-sock' : '.sock');
    }
    function uniqueUserId() {
        var username;
        if (platform.isWindows) {
            username = process.env.USERNAME;
        }
        else {
            username = process.env.USER;
        }
        if (!username) {
            return ''; // fail gracefully if there is no user name
        }
        // use sha256 to ensure the userid value can be used in filenames and are unique
        return crypto.createHash('sha256').update(username).digest('hex').substr(0, 6);
    }
    function parseOpts(argv) {
        return argv
            .filter(function (a) { return /^-/.test(a); })
            .map(function (a) { return a.replace(/^-*/, ''); })
            .reduce(function (r, a) { r[a] = true; return r; }, {});
    }
    function parsePathArguments(argv, gotoLineMode) {
        return arrays.coalesce(// no invalid paths
        arrays.distinct(// no duplicates
        argv.filter(function (a) { return !(/^-/.test(a)); }) // arguments without leading "-"
            .map(function (arg) {
            var pathCandidate = arg;
            var parsedPath;
            if (gotoLineMode) {
                parsedPath = parseLineAndColumnAware(arg);
                pathCandidate = parsedPath.path;
            }
            if (pathCandidate) {
                pathCandidate = massagePath(pathCandidate);
            }
            var realPath;
            try {
                realPath = fs.realpathSync(pathCandidate);
            }
            catch (error) {
                // in case of an error, assume the user wants to create this file
                // if the path is relative, we join it to the cwd
                realPath = path.normalize(path.isAbsolute(pathCandidate) ? pathCandidate : path.join(process.cwd(), pathCandidate));
            }
            if (!paths.isValidBasename(path.basename(realPath))) {
                return null; // do not allow invalid file names
            }
            if (gotoLineMode) {
                parsedPath.path = realPath;
                return toLineAndColumnPath(parsedPath);
            }
            return realPath;
        }), function (element) {
            return element && (platform.isWindows || platform.isMacintosh) ? element.toLowerCase() : element; // only linux is case sensitive on the fs
        }));
    }
    function massagePath(path) {
        if (platform.isWindows) {
            path = strings.rtrim(path, '"'); // https://github.com/Microsoft/vscode/issues/1498
        }
        // Trim whitespaces
        path = strings.trim(strings.trim(path, ' '), '\t');
        // Remove trailing dots
        path = strings.rtrim(path, '.');
        return path;
    }
    function normalizePath(p) {
        return p ? path.normalize(p) : p;
    }
    function parseNumber(argv, key, defaultValue, fallbackValue) {
        var value;
        for (var i = 0; i < argv.length; i++) {
            var segments = argv[i].split('=');
            if (segments[0] === key) {
                value = Number(segments[1]) || defaultValue;
                break;
            }
        }
        return types.isNumber(value) ? value : fallbackValue;
    }
    function parseString(argv, key, defaultValue, fallbackValue) {
        var value;
        for (var i = 0; i < argv.length; i++) {
            var segments = argv[i].split('=');
            if (segments[0] === key) {
                value = String(segments[1]) || defaultValue;
                break;
            }
        }
        return types.isString(value) ? strings.trim(value, '"') : fallbackValue;
    }
    function getPlatformIdentifier() {
        if (process.platform === 'linux') {
            return "linux-" + process.arch;
        }
        return process.platform;
    }
    exports.getPlatformIdentifier = getPlatformIdentifier;
    function parseLineAndColumnAware(rawPath) {
        var segments = rawPath.split(':'); // C:\file.txt:<line>:<column>
        var path;
        var line = null;
        var column = null;
        segments.forEach(function (segment) {
            var segmentAsNumber = Number(segment);
            if (!types.isNumber(segmentAsNumber)) {
                path = !!path ? [path, segment].join(':') : segment; // a colon can well be part of a path (e.g. C:\...)
            }
            else if (line === null) {
                line = segmentAsNumber;
            }
            else if (column === null) {
                column = segmentAsNumber;
            }
        });
        return {
            path: path,
            line: line !== null ? line : void 0,
            column: column !== null ? column : line !== null ? 1 : void 0 // if we have a line, make sure column is also set
        };
    }
    exports.parseLineAndColumnAware = parseLineAndColumnAware;
    function toLineAndColumnPath(parsedPath) {
        var segments = [parsedPath.path];
        if (types.isNumber(parsedPath.line)) {
            segments.push(String(parsedPath.line));
        }
        if (types.isNumber(parsedPath.column)) {
            segments.push(String(parsedPath.column));
        }
        return segments.join(':');
    }
    exports.toLineAndColumnPath = toLineAndColumnPath;
});
//# sourceMappingURL=env.js.map