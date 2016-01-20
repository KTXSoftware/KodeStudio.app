/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", 'vs/nls', 'vs/base/common/objects', 'vs/base/common/strings', 'vs/base/common/assert', 'vs/base/common/paths', 'vs/base/common/types', 'vs/base/common/severity', 'vs/base/common/uri', 'vs/base/common/parsers'], function (require, exports, NLS, Objects, Strings, Assert, Paths, Types, severity_1, uri_1, parsers_1) {
    (function (FileLocationKind) {
        FileLocationKind[FileLocationKind["Auto"] = 0] = "Auto";
        FileLocationKind[FileLocationKind["Relative"] = 1] = "Relative";
        FileLocationKind[FileLocationKind["Absolute"] = 2] = "Absolute";
    })(exports.FileLocationKind || (exports.FileLocationKind = {}));
    var FileLocationKind = exports.FileLocationKind;
    var FileLocationKind;
    (function (FileLocationKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'absolute') {
                return FileLocationKind.Absolute;
            }
            else if (value === 'relative') {
                return FileLocationKind.Relative;
            }
            else {
                return undefined;
            }
        }
        FileLocationKind.fromString = fromString;
    })(FileLocationKind = exports.FileLocationKind || (exports.FileLocationKind = {}));
    exports.problemPatternProperties = ['file', 'message', 'location', 'line', 'column', 'endLine', 'endColumn', 'code', 'severity', 'loop', 'mostSignifikant'];
    (function (ApplyToKind) {
        ApplyToKind[ApplyToKind["allDocuments"] = 0] = "allDocuments";
        ApplyToKind[ApplyToKind["openDocuments"] = 1] = "openDocuments";
        ApplyToKind[ApplyToKind["closedDocuments"] = 2] = "closedDocuments";
    })(exports.ApplyToKind || (exports.ApplyToKind = {}));
    var ApplyToKind = exports.ApplyToKind;
    var ApplyToKind;
    (function (ApplyToKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'alldocuments') {
                return ApplyToKind.allDocuments;
            }
            else if (value === 'opendocuments') {
                return ApplyToKind.openDocuments;
            }
            else if (value === 'closeddocuments') {
                return ApplyToKind.closedDocuments;
            }
            else {
                return undefined;
            }
        }
        ApplyToKind.fromString = fromString;
    })(ApplyToKind = exports.ApplyToKind || (exports.ApplyToKind = {}));
    function isNamedProblemMatcher(value) {
        return Types.isString(value.name);
    }
    exports.isNamedProblemMatcher = isNamedProblemMatcher;
    var valueMap = {
        E: 'error',
        W: 'warning',
        I: 'info',
    };
    function getResource(filename, matcher) {
        var kind = matcher.fileLocation;
        var fullPath;
        if (kind === FileLocationKind.Absolute) {
            fullPath = filename;
        }
        else if (kind === FileLocationKind.Relative) {
            fullPath = Paths.join(matcher.filePrefix, filename);
        }
        fullPath = fullPath.replace(/\\/g, '/');
        if (fullPath[0] !== '/') {
            fullPath = '/' + fullPath;
        }
        return uri_1.default.parse('file://' + fullPath);
    }
    exports.getResource = getResource;
    function createLineMatcher(matcher) {
        var pattern = matcher.pattern;
        if (Types.isArray(pattern)) {
            return new MultiLineMatcher(matcher);
        }
        else {
            return new SingleLineMatcher(matcher);
        }
    }
    exports.createLineMatcher = createLineMatcher;
    var AbstractLineMatcher = (function () {
        function AbstractLineMatcher(matcher) {
            this.matcher = matcher;
        }
        AbstractLineMatcher.prototype.handle = function (lines, start) {
            if (start === void 0) { start = 0; }
            return { match: null, continue: false };
        };
        AbstractLineMatcher.prototype.next = function (line) {
            return null;
        };
        Object.defineProperty(AbstractLineMatcher.prototype, "matchLength", {
            get: function () {
                throw new Error('Subclass reponsibility');
            },
            enumerable: true,
            configurable: true
        });
        AbstractLineMatcher.prototype.fillProblemData = function (data, pattern, matches) {
            this.fillProperty(data, 'file', pattern, matches, true);
            this.fillProperty(data, 'message', pattern, matches, true);
            this.fillProperty(data, 'code', pattern, matches, true);
            this.fillProperty(data, 'severity', pattern, matches, true);
            this.fillProperty(data, 'location', pattern, matches, true);
            this.fillProperty(data, 'line', pattern, matches);
            this.fillProperty(data, 'column', pattern, matches);
            this.fillProperty(data, 'endLine', pattern, matches);
            this.fillProperty(data, 'endColumn', pattern, matches);
        };
        AbstractLineMatcher.prototype.fillProperty = function (data, property, pattern, matches, trim) {
            if (trim === void 0) { trim = false; }
            if (Types.isUndefined(data[property]) && !Types.isUndefined(pattern[property]) && pattern[property] < matches.length) {
                var value = matches[pattern[property]];
                if (trim) {
                    value = Strings.trim(value);
                }
                data[property] = value;
            }
        };
        AbstractLineMatcher.prototype.getMarkerMatch = function (data) {
            var location = this.getLocation(data);
            if (data.file && location && data.message) {
                var marker = {
                    severity: this.getSeverity(data),
                    startLineNumber: location.startLineNumber,
                    startColumn: location.startColumn,
                    endLineNumber: location.startLineNumber,
                    endColumn: location.endColumn,
                    message: data.message
                };
                if (!Types.isUndefined(data.code)) {
                    marker.code = data.code;
                }
                return {
                    description: this.matcher,
                    resource: this.getResource(data.file),
                    marker: marker
                };
            }
        };
        AbstractLineMatcher.prototype.getResource = function (filename) {
            return getResource(filename, this.matcher);
        };
        AbstractLineMatcher.prototype.getLocation = function (data) {
            if (data.location) {
                return this.parseLocationInfo(data.location);
            }
            if (!data.line) {
                return null;
            }
            var startLine = parseInt(data.line);
            var startColumn = data.column ? parseInt(data.column) : undefined;
            var endLine = data.endLine ? parseInt(data.endLine) : undefined;
            var endColumn = data.endColumn ? parseInt(data.endColumn) : undefined;
            return this.createLocation(startLine, startColumn, endLine, endColumn);
        };
        AbstractLineMatcher.prototype.parseLocationInfo = function (value) {
            if (!value || !value.match(/(\d+|\d+,\d+|\d+,\d+,\d+,\d+)/)) {
                return null;
            }
            var parts = value.split(',');
            var startLine = parseInt(parts[0]);
            var startColumn = parts.length > 1 ? parseInt(parts[1]) : undefined;
            if (parts.length > 3) {
                return this.createLocation(startLine, startColumn, parseInt(parts[2]), parseInt(parts[3]));
            }
            else {
                return this.createLocation(startLine, startColumn, undefined, undefined);
            }
        };
        AbstractLineMatcher.prototype.createLocation = function (startLine, startColumn, endLine, endColumn) {
            if (startLine && startColumn && endLine && endColumn) {
                return { startLineNumber: startLine, startColumn: startColumn, endLineNumber: endLine, endColumn: endColumn };
            }
            if (startLine && startColumn) {
                return { startLineNumber: startLine, startColumn: startColumn, endLineNumber: startLine, endColumn: startColumn };
            }
            return { startLineNumber: startLine, startColumn: 1, endLineNumber: startLine, endColumn: Number.MAX_VALUE };
        };
        AbstractLineMatcher.prototype.getSeverity = function (data) {
            var result = null;
            if (data.severity) {
                var value = data.severity;
                if (value && value.length > 0) {
                    if (value.length === 1 && valueMap[value[0]]) {
                        value = valueMap[value[0]];
                    }
                    result = severity_1.default.fromValue(value);
                }
            }
            if (result === null || result === severity_1.default.Ignore) {
                result = this.matcher.severity || severity_1.default.Error;
            }
            return result;
        };
        return AbstractLineMatcher;
    })();
    var SingleLineMatcher = (function (_super) {
        __extends(SingleLineMatcher, _super);
        function SingleLineMatcher(matcher) {
            _super.call(this, matcher);
            this.pattern = matcher.pattern;
        }
        Object.defineProperty(SingleLineMatcher.prototype, "matchLength", {
            get: function () {
                return 1;
            },
            enumerable: true,
            configurable: true
        });
        SingleLineMatcher.prototype.handle = function (lines, start) {
            if (start === void 0) { start = 0; }
            Assert.ok(lines.length - start === 1);
            var data = Object.create(null);
            var matches = this.pattern.regexp.exec(lines[start]);
            if (matches) {
                this.fillProblemData(data, this.pattern, matches);
                var match = this.getMarkerMatch(data);
                if (match) {
                    return { match: match, continue: false };
                }
            }
            return { match: null, continue: false };
        };
        SingleLineMatcher.prototype.next = function (line) {
            return null;
        };
        return SingleLineMatcher;
    })(AbstractLineMatcher);
    var MultiLineMatcher = (function (_super) {
        __extends(MultiLineMatcher, _super);
        function MultiLineMatcher(matcher) {
            _super.call(this, matcher);
            this.patterns = matcher.pattern;
        }
        Object.defineProperty(MultiLineMatcher.prototype, "matchLength", {
            get: function () {
                return this.patterns.length;
            },
            enumerable: true,
            configurable: true
        });
        MultiLineMatcher.prototype.handle = function (lines, start) {
            if (start === void 0) { start = 0; }
            Assert.ok(lines.length - start === this.patterns.length);
            this.data = Object.create(null);
            var data = this.data;
            for (var i = 0; i < this.patterns.length; i++) {
                var pattern = this.patterns[i];
                var matches = pattern.regexp.exec(lines[i + start]);
                if (!matches) {
                    return { match: null, continue: false };
                }
                else {
                    // Only the last pattern can loop
                    if (pattern.loop && i === this.patterns.length - 1) {
                        data = Objects.clone(data);
                    }
                    this.fillProblemData(data, pattern, matches);
                }
            }
            var loop = this.patterns[this.patterns.length - 1].loop;
            if (!loop) {
                this.data = null;
            }
            return { match: this.getMarkerMatch(data), continue: loop };
        };
        MultiLineMatcher.prototype.next = function (line) {
            var pattern = this.patterns[this.patterns.length - 1];
            Assert.ok(pattern.loop === true && this.data !== null);
            var matches = pattern.regexp.exec(line);
            if (!matches) {
                this.data = null;
                return null;
            }
            var data = Objects.clone(this.data);
            this.fillProblemData(data, pattern, matches);
            return this.getMarkerMatch(data);
        };
        return MultiLineMatcher;
    })(AbstractLineMatcher);
    var _defaultPatterns = Object.create(null);
    _defaultPatterns['msCompile'] = {
        regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(\w{1,2}\d+)\s*:\s*(.*)$/,
        file: 1,
        location: 2,
        severity: 3,
        code: 4,
        message: 5
    };
    _defaultPatterns['gulp-tsc'] = {
        regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(\d+)\s+(.*)$/,
        file: 1,
        location: 2,
        code: 3,
        message: 4
    };
    _defaultPatterns['tsc'] = {
        regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(TS\d+)\s*:\s*(.*)$/,
        file: 1,
        location: 2,
        severity: 3,
        code: 4,
        message: 5
    };
    _defaultPatterns['cpp'] = {
        regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(C\d+)\s*:\s*(.*)$/,
        file: 1,
        location: 2,
        severity: 3,
        code: 4,
        message: 5
    };
    _defaultPatterns['csc'] = {
        regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(CS\d+)\s*:\s*(.*)$/,
        file: 1,
        location: 2,
        severity: 3,
        code: 4,
        message: 5
    };
    _defaultPatterns['vb'] = {
        regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(BC\d+)\s*:\s*(.*)$/,
        file: 1,
        location: 2,
        severity: 3,
        code: 4,
        message: 5
    };
    _defaultPatterns['lessCompile'] = {
        regexp: /^\s*(.*) in file (.*) line no. (\d+)$/,
        message: 1,
        file: 2,
        line: 3
    };
    _defaultPatterns['jshint'] = {
        regexp: /^(.*):\s+line\s+(\d+),\s+col\s+(\d+),\s(.+?)(?:\s+\((\w)(\d+)\))?$/,
        file: 1,
        line: 2,
        column: 3,
        message: 4,
        severity: 5,
        code: 6
    };
    _defaultPatterns['jshint-stylish'] = [
        {
            regexp: /^(.+)$/,
            file: 1
        },
        {
            regexp: /^\s+line\s+(\d+)\s+col\s+(\d+)\s+(.+?)(?:\s+\((\w)(\d+)\))?$/,
            line: 1,
            column: 2,
            message: 3,
            severity: 4,
            code: 5,
            loop: true
        }
    ];
    _defaultPatterns['eslint-compact'] = {
        regexp: /^(.+):\sline\s(\d+),\scol\s(\d+),\s(Error|Warning|Info)\s-\s(.+)\s\((.+)\)$/,
        file: 1,
        line: 2,
        column: 3,
        severity: 4,
        message: 5,
        code: 6
    };
    _defaultPatterns['eslint-stylish'] = [
        {
            regexp: /^([^\s].*)$/,
            file: 1
        },
        {
            regexp: /^\s+(\d+):(\d+)\s+(error|warning|info)\s+(.+?)\s\s+(.*)$/,
            line: 1,
            column: 2,
            severity: 3,
            message: 4,
            code: 5,
            loop: true
        }
    ];
    function defaultPattern(name) {
        return _defaultPatterns[name];
    }
    exports.defaultPattern = defaultPattern;
    var Config;
    (function (Config) {
        /**
        * Defines possible problem severity values
        */
        var ProblemSeverity;
        (function (ProblemSeverity) {
            ProblemSeverity.Error = 'error';
            ProblemSeverity.Warning = 'warning';
            ProblemSeverity.Info = 'info';
        })(ProblemSeverity = Config.ProblemSeverity || (Config.ProblemSeverity = {}));
        function isNamedProblemMatcher(value) {
            return Types.isString(value.name);
        }
        Config.isNamedProblemMatcher = isNamedProblemMatcher;
    })(Config = exports.Config || (exports.Config = {}));
    var ProblemMatcherParser = (function (_super) {
        __extends(ProblemMatcherParser, _super);
        function ProblemMatcherParser(resolver, logger, validationStatus) {
            if (validationStatus === void 0) { validationStatus = new parsers_1.ValidationStatus(); }
            _super.call(this, logger, validationStatus);
            this.resolver = resolver;
        }
        ProblemMatcherParser.prototype.parse = function (json) {
            var result = this.createProblemMatcher(json);
            if (!this.checkProblemMatcherValid(json, result)) {
                return null;
            }
            this.addWatchingMatcher(json, result);
            return result;
        };
        ProblemMatcherParser.prototype.checkProblemMatcherValid = function (externalProblemMatcher, problemMatcher) {
            if (!problemMatcher || !problemMatcher.pattern || !problemMatcher.owner || Types.isUndefined(problemMatcher.fileLocation)) {
                this.status.state = parsers_1.ValidationState.Fatal;
                this.log(NLS.localize('ProblemMatcherParser.invalidMarkerDescription', 'Error: Invalid problemMatcher description. A matcher must at least define a pattern, owner and a file location. The problematic matcher is:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            return true;
        };
        ProblemMatcherParser.prototype.createProblemMatcher = function (description) {
            var result = null;
            var owner = description.owner ? description.owner : 'external';
            var applyTo = Types.isString(description.applyTo) ? ApplyToKind.fromString(description.applyTo) : ApplyToKind.allDocuments;
            if (!applyTo) {
                applyTo = ApplyToKind.allDocuments;
            }
            var fileLocation = undefined;
            var filePrefix = undefined;
            var kind;
            if (Types.isUndefined(description.fileLocation)) {
                fileLocation = FileLocationKind.Relative;
                filePrefix = '${cwd}';
            }
            else if (Types.isString(description.fileLocation)) {
                kind = FileLocationKind.fromString(description.fileLocation);
                if (kind) {
                    fileLocation = kind;
                    if (kind === FileLocationKind.Relative) {
                        filePrefix = '${cwd}';
                    }
                }
            }
            else if (Types.isStringArray(description.fileLocation)) {
                var values = description.fileLocation;
                if (values.length > 0) {
                    kind = FileLocationKind.fromString(values[0]);
                    if (values.length === 1 && kind === FileLocationKind.Absolute) {
                        fileLocation = kind;
                    }
                    else if (values.length === 2 && kind === FileLocationKind.Relative && values[1]) {
                        fileLocation = kind;
                        filePrefix = values[1];
                    }
                }
            }
            var pattern = description.pattern ? this.createProblemPattern(description.pattern) : undefined;
            var severity = description.severity ? severity_1.default.fromValue(description.severity) : undefined;
            if (severity === severity_1.default.Ignore) {
                this.status.state = parsers_1.ValidationState.Info;
                this.log(NLS.localize('ProblemMatcherParser.unknownSeverity', 'Info: unknown severity {0}. Valid values are error, warning and info.\n', description.severity));
                severity = severity_1.default.Error;
            }
            if (Types.isString(description.base)) {
                var variableName = description.base;
                if (variableName.length > 1 && variableName[0] === '$') {
                    var base = this.resolver.get(variableName.substring(1));
                    if (base) {
                        result = Objects.clone(base);
                        if (description.owner) {
                            result.owner = owner;
                        }
                        if (fileLocation) {
                            result.fileLocation = fileLocation;
                        }
                        if (filePrefix) {
                            result.filePrefix = filePrefix;
                        }
                        if (description.pattern) {
                            result.pattern = pattern;
                        }
                        if (description.severity) {
                            result.severity = severity;
                        }
                    }
                }
            }
            else if (fileLocation) {
                result = {
                    owner: owner,
                    applyTo: applyTo,
                    fileLocation: fileLocation,
                    pattern: pattern,
                };
                if (filePrefix) {
                    result.filePrefix = filePrefix;
                }
                if (severity) {
                    result.severity = severity;
                }
            }
            if (Config.isNamedProblemMatcher(description)) {
                result.name = description.name;
            }
            return result;
        };
        ProblemMatcherParser.prototype.createProblemPattern = function (value) {
            var pattern;
            if (Types.isString(value)) {
                var variableName = value;
                if (variableName.length > 1 && variableName[0] === '$') {
                    return defaultPattern(variableName.substring(1));
                }
            }
            else if (Types.isArray(value)) {
                var values = value;
                var result = [];
                for (var i = 0; i < values.length; i++) {
                    pattern = this.createSingleProblemPattern(values[i], false);
                    if (i < values.length - 1) {
                        if (!Types.isUndefined(pattern.loop) && pattern.loop) {
                            pattern.loop = false;
                            this.status.state = parsers_1.ValidationState.Error;
                            this.log(NLS.localize('ProblemMatcherParser.loopProperty.notLast', 'The loop property is only supported on the last line matcher.'));
                        }
                    }
                    result.push(pattern);
                }
                this.validateProblemPattern(result);
                return result;
            }
            else {
                pattern = this.createSingleProblemPattern(value, true);
                if (!Types.isUndefined(pattern.loop) && pattern.loop) {
                    pattern.loop = false;
                    this.status.state = parsers_1.ValidationState.Error;
                    this.log(NLS.localize('ProblemMatcherParser.loopProperty.notMultiLine', 'The loop property is only supported on multi line matchers.'));
                }
                this.validateProblemPattern([pattern]);
                return pattern;
            }
            return null;
        };
        ProblemMatcherParser.prototype.createSingleProblemPattern = function (value, setDefaults) {
            var result = {
                regexp: this.createRegularExpression(value.regexp)
            };
            exports.problemPatternProperties.forEach(function (property) {
                if (!Types.isUndefined(value[property])) {
                    result[property] = value[property];
                }
            });
            if (setDefaults) {
                if (result.location) {
                    result = Objects.mixin(result, {
                        file: 1,
                        message: 4
                    }, false);
                }
                else {
                    result = Objects.mixin(result, {
                        file: 1,
                        line: 2,
                        column: 3,
                        message: 4
                    }, false);
                }
            }
            return result;
        };
        ProblemMatcherParser.prototype.validateProblemPattern = function (values) {
            var file, message, location, line;
            var regexp = 0;
            values.forEach(function (pattern) {
                file = file || !!pattern.file;
                message = message || !!pattern.message;
                location = location || !!pattern.location;
                line = line || !!pattern.line;
                if (pattern.regexp) {
                    regexp++;
                }
            });
            if (regexp !== values.length) {
                this.status.state = parsers_1.ValidationState.Error;
                this.log(NLS.localize('ProblemMatcherParser.problemPattern.missingRegExp', 'The problem pattern is missing a regular expression.'));
            }
            if (!(file && message && (location || line))) {
                this.status.state = parsers_1.ValidationState.Error;
                this.log(NLS.localize('ProblemMatcherParser.problemPattern.missingProperty', 'The problem pattern is invalid. It must have at least a file, message and line or location match group.'));
            }
            ;
        };
        ProblemMatcherParser.prototype.addWatchingMatcher = function (external, internal) {
            var oldBegins = this.createRegularExpression(external.watchedTaskBeginsRegExp);
            var oldEnds = this.createRegularExpression(external.watchedTaskEndsRegExp);
            if (oldBegins && oldEnds) {
                internal.watching = {
                    activeOnStart: false,
                    beginsPattern: { regexp: oldBegins },
                    endsPattern: { regexp: oldEnds }
                };
                return;
            }
            if (Types.isUndefinedOrNull(external.watching)) {
                return;
            }
            var watching = external.watching;
            var begins = this.createWatchingPattern(watching.beginsPattern);
            var ends = this.createWatchingPattern(watching.endsPattern);
            if (begins && ends) {
                internal.watching = {
                    activeOnStart: Types.isBoolean(watching.activeOnStart) ? watching.activeOnStart : false,
                    beginsPattern: begins,
                    endsPattern: ends
                };
                return;
            }
            if (begins || ends) {
                this.status.state = parsers_1.ValidationState.Error;
                this.log(NLS.localize('ProblemMatcherParser.problemPattern.watchingMatcher', 'A problem matcher must define both a begin pattern and an end pattern for watching.'));
            }
        };
        ProblemMatcherParser.prototype.createWatchingPattern = function (external) {
            if (Types.isUndefinedOrNull(external)) {
                return null;
            }
            var regexp;
            var file;
            if (Types.isString(external)) {
                regexp = this.createRegularExpression(external);
            }
            else {
                regexp = this.createRegularExpression(external.regexp);
                if (Types.isNumber(external.file)) {
                    file = external.file;
                }
            }
            if (!regexp) {
                return null;
            }
            return file ? { regexp: regexp, file: file } : { regexp: regexp };
        };
        ProblemMatcherParser.prototype.createRegularExpression = function (value) {
            var result = null;
            if (!value) {
                return result;
            }
            try {
                result = new RegExp(value);
            }
            catch (err) {
                this.status.state = parsers_1.ValidationState.Fatal;
                this.log(NLS.localize('ProblemMatcherParser.invalidRegexp', 'Error: The string {0} is not a valid regular expression.\n', value));
            }
            return result;
        };
        return ProblemMatcherParser;
    })(parsers_1.Parser);
    exports.ProblemMatcherParser = ProblemMatcherParser;
    // let problemMatchersExtPoint = PluginsRegistry.registerExtensionPoint<Config.NamedProblemMatcher | Config.NamedProblemMatcher[]>('problemMatchers', {
    // TODO@Dirk: provide here JSON schema for extension point
    // });
    var ProblemMatcherRegistry = (function () {
        function ProblemMatcherRegistry() {
            this.matchers = Object.create(null);
            /*
            problemMatchersExtPoint.setHandler((extensions, collector) => {
                // TODO@Dirk: validate extensions here and collect errors/warnings in `collector`
                extensions.forEach(extension => {
                    let extensions = extension.value;
                    if (Types.isArray(extensions)) {
                        (<Config.NamedProblemMatcher[]>extensions).forEach(this.onProblemMatcher, this);
                    } else {
                        this.onProblemMatcher(extensions)
                    }
                });
            });
            */
        }
        ProblemMatcherRegistry.prototype.onProblemMatcher = function (json) {
            var logger = {
                log: function (message) { console.warn(message); }
            };
            var parser = new ProblemMatcherParser(this, logger);
            var result = parser.parse(json);
            if (isNamedProblemMatcher(result) && parser.status.isOK()) {
                this.add(result.name, result);
            }
        };
        ProblemMatcherRegistry.prototype.add = function (name, matcher) {
            this.matchers[name] = matcher;
        };
        ProblemMatcherRegistry.prototype.get = function (name) {
            return this.matchers[name];
        };
        ProblemMatcherRegistry.prototype.exists = function (name) {
            return !!this.matchers[name];
        };
        ProblemMatcherRegistry.prototype.remove = function (name) {
            delete this.matchers[name];
        };
        return ProblemMatcherRegistry;
    })();
    exports.ProblemMatcherRegistry = ProblemMatcherRegistry;
    exports.registry = new ProblemMatcherRegistry();
    exports.registry.add('msCompile', {
        owner: 'msCompile',
        applyTo: ApplyToKind.allDocuments,
        fileLocation: FileLocationKind.Absolute,
        pattern: defaultPattern('msCompile')
    });
    exports.registry.add('lessCompile', {
        owner: 'lessCompile',
        applyTo: ApplyToKind.allDocuments,
        fileLocation: FileLocationKind.Absolute,
        pattern: defaultPattern('lessCompile'),
        severity: severity_1.default.Error
    });
    exports.registry.add('tsc', {
        owner: 'typescript',
        applyTo: ApplyToKind.closedDocuments,
        fileLocation: FileLocationKind.Relative,
        filePrefix: '${cwd}',
        pattern: defaultPattern('tsc')
    });
    var matcher = {
        owner: 'typescript',
        applyTo: ApplyToKind.closedDocuments,
        fileLocation: FileLocationKind.Relative,
        filePrefix: '${cwd}',
        pattern: defaultPattern('tsc'),
        watching: {
            activeOnStart: true,
            beginsPattern: { regexp: /^\s*(?:message TS6032:|\d{1,2}:\d{1,2}:\d{1,2}(?: AM| PM)? -) File change detected\. Starting incremental compilation\.\.\./ },
            endsPattern: { regexp: /^\s*(?:message TS6042:|\d{1,2}:\d{1,2}:\d{1,2}(?: AM| PM)? -) Compilation complete\. Watching for file changes\./ }
        }
    };
    matcher.tscWatch = true;
    exports.registry.add('tsc-watch', matcher);
    exports.registry.add('gulp-tsc', {
        owner: 'typescript',
        applyTo: ApplyToKind.closedDocuments,
        fileLocation: FileLocationKind.Relative,
        filePrefix: '${cwd}',
        pattern: defaultPattern('gulp-tsc')
    });
    exports.registry.add('jshint', {
        owner: 'javascript',
        applyTo: ApplyToKind.allDocuments,
        fileLocation: FileLocationKind.Absolute,
        pattern: defaultPattern('jshint')
    });
    exports.registry.add('jshint-stylish', {
        owner: 'javascript',
        applyTo: ApplyToKind.allDocuments,
        fileLocation: FileLocationKind.Absolute,
        pattern: defaultPattern('jshint-stylish')
    });
    exports.registry.add('eslint-compact', {
        owner: 'javascript',
        applyTo: ApplyToKind.allDocuments,
        fileLocation: FileLocationKind.Relative,
        filePrefix: '${cwd}',
        pattern: defaultPattern('eslint-compact')
    });
    exports.registry.add('eslint-stylish', {
        owner: 'javascript',
        applyTo: ApplyToKind.allDocuments,
        fileLocation: FileLocationKind.Relative,
        filePrefix: '${cwd}',
        pattern: defaultPattern('eslint-stylish')
    });
});
//# sourceMappingURL=problemMatcher.js.map