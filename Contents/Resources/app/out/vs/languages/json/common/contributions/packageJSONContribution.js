/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", 'vs/base/common/strings', 'vs/nls', 'vs/platform/request/common/request'], function (require, exports, Strings, nls, request_1) {
    var LIMIT = 40;
    var PackageJSONContribution = (function () {
        function PackageJSONContribution(requestService) {
            this.mostDependedOn = ['lodash', 'async', 'underscore', 'request', 'commander', 'express', 'debug', 'chalk', 'colors', 'q', 'coffee-script',
                'mkdirp', 'optimist', 'through2', 'yeoman-generator', 'moment', 'bluebird', 'glob', 'gulp-util', 'minimist', 'cheerio', 'jade', 'redis', 'node-uuid',
                'socket', 'io', 'uglify-js', 'winston', 'through', 'fs-extra', 'handlebars', 'body-parser', 'rimraf', 'mime', 'semver', 'mongodb', 'jquery',
                'grunt', 'connect', 'yosay', 'underscore', 'string', 'xml2js', 'ejs', 'mongoose', 'marked', 'extend', 'mocha', 'superagent', 'js-yaml', 'xtend',
                'shelljs', 'gulp', 'yargs', 'browserify', 'minimatch', 'react', 'less', 'prompt', 'inquirer', 'ws', 'event-stream', 'inherits', 'mysql', 'esprima',
                'jsdom', 'stylus', 'when', 'readable-stream', 'aws-sdk', 'concat-stream', 'chai', 'promise', 'wrench'];
            this.requestService = requestService;
        }
        PackageJSONContribution.prototype.isPackageJSONFile = function (resource) {
            var path = resource.path;
            return Strings.endsWith(path, '/package.json');
        };
        PackageJSONContribution.prototype.collectDefaultSuggestions = function (resource, result) {
            if (this.isPackageJSONFile(resource)) {
                var defaultValue = {
                    'name': '{{name}}',
                    'description': '{{description}}',
                    'author': '{{author}}',
                    'version': '{{1.0.0}}',
                    'main': '{{pathToMain}}',
                    'dependencies': {}
                };
                result.add({ type: 'module', label: nls.localize('json.package.default', 'Default package.json'), codeSnippet: JSON.stringify(defaultValue, null, '\t'), documentationLabel: '' });
            }
            return null;
        };
        PackageJSONContribution.prototype.collectPropertySuggestions = function (resource, location, currentWord, addValue, isLast, result) {
            if (this.isPackageJSONFile(resource) && (location.matches(['dependencies']) || location.matches(['devDependencies']) || location.matches(['optionalDependencies']) || location.matches(['peerDependencies']))) {
                var queryUrl;
                if (currentWord.length > 0) {
                    queryUrl = 'https://skimdb.npmjs.com/registry/_design/app/_view/browseAll?group_level=1&limit=' + LIMIT + '&start_key=%5B%22' + encodeURIComponent(currentWord) + '%22%5D&end_key=%5B%22' + encodeURIComponent(currentWord + 'z') + '%22,%7B%7D%5D';
                    return this.requestService.makeRequest({
                        url: queryUrl
                    }).then(function (success) {
                        if (success.status === 200) {
                            try {
                                var obj = JSON.parse(success.responseText);
                                if (obj && Array.isArray(obj.rows)) {
                                    var results = obj.rows;
                                    for (var i = 0; i < results.length; i++) {
                                        var keys = results[i].key;
                                        if (Array.isArray(keys) && keys.length > 0) {
                                            var name = keys[0];
                                            var codeSnippet = JSON.stringify(name);
                                            if (addValue) {
                                                codeSnippet += ': "{{*}}"';
                                                if (!isLast) {
                                                    codeSnippet += ',';
                                                }
                                            }
                                            result.add({ type: 'property', label: name, codeSnippet: codeSnippet, documentationLabel: '' });
                                        }
                                    }
                                    if (results.length === LIMIT) {
                                        result.setAsIncomplete();
                                    }
                                }
                            }
                            catch (e) {
                            }
                        }
                        else {
                            result.error(nls.localize('json.npm.error.repoaccess', 'Request to the NPM repository failed: {0}', success.responseText));
                            return 0;
                        }
                    }, function (error) {
                        result.error(nls.localize('json.npm.error.repoaccess', 'Request to the NPM repository failed: {0}', error.responseText));
                        return 0;
                    });
                }
                else {
                    this.mostDependedOn.forEach(function (name) {
                        var codeSnippet = JSON.stringify(name);
                        if (addValue) {
                            codeSnippet += ': "{{*}}"';
                            if (!isLast) {
                                codeSnippet += ',';
                            }
                        }
                        result.add({ type: 'property', label: name, codeSnippet: codeSnippet, documentationLabel: '' });
                    });
                    result.setAsIncomplete();
                }
            }
            return null;
        };
        PackageJSONContribution.prototype.collectValueSuggestions = function (resource, location, currentKey, result) {
            if (this.isPackageJSONFile(resource) && (location.matches(['dependencies']) || location.matches(['devDependencies']) || location.matches(['optionalDependencies']) || location.matches(['peerDependencies']))) {
                var queryUrl = 'http://registry.npmjs.org/' + encodeURIComponent(currentKey) + '/latest';
                return this.requestService.makeRequest({
                    url: queryUrl
                }).then(function (success) {
                    try {
                        var obj = JSON.parse(success.responseText);
                        if (obj && obj.version) {
                            var version = obj.version;
                            var name = JSON.stringify(version);
                            result.add({ type: 'class', label: name, codeSnippet: name, documentationLabel: nls.localize('json.npm.latestversion', 'The currently latest version of the package') });
                            name = JSON.stringify('^' + version);
                            result.add({ type: 'class', label: name, codeSnippet: name, documentationLabel: nls.localize('json.npm.majorversion', 'Matches the most recent major version (1.x.x)') });
                            name = JSON.stringify('~' + version);
                            result.add({ type: 'class', label: name, codeSnippet: name, documentationLabel: nls.localize('json.npm.minorversion', 'Matches the most recent minor version (1.2.x)') });
                        }
                    }
                    catch (e) {
                    }
                    return 0;
                }, function (error) {
                    return 0;
                });
            }
            return null;
        };
        PackageJSONContribution.prototype.getInfoContribution = function (resource, location) {
            if (this.isPackageJSONFile(resource) && (location.matches(['dependencies', '*']) || location.matches(['devDependencies', '*']) || location.matches(['optionalDependencies', '*']) || location.matches(['peerDependencies', '*']))) {
                var pack = location.getSegments()[location.getSegments().length - 1];
                var htmlContent = [];
                htmlContent.push({ className: 'type', text: nls.localize('json.npm.package.hover', '{0}', pack) });
                var queryUrl = 'http://registry.npmjs.org/' + encodeURIComponent(pack) + '/latest';
                return this.requestService.makeRequest({
                    url: queryUrl
                }).then(function (success) {
                    try {
                        var obj = JSON.parse(success.responseText);
                        if (obj) {
                            if (obj.description) {
                                htmlContent.push({ className: 'documentation', text: obj.description });
                            }
                            if (obj.version) {
                                htmlContent.push({ className: 'documentation', text: nls.localize('json.npm.version.hover', 'Latest version: {0}', obj.version) });
                            }
                        }
                    }
                    catch (e) {
                    }
                    return htmlContent;
                }, function (error) {
                    return htmlContent;
                });
            }
            return null;
        };
        PackageJSONContribution = __decorate([
            __param(0, request_1.IRequestService)
        ], PackageJSONContribution);
        return PackageJSONContribution;
    })();
    exports.PackageJSONContribution = PackageJSONContribution;
});
//# sourceMappingURL=packageJSONContribution.js.map