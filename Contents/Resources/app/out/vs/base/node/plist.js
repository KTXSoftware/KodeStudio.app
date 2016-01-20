/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'sax'], function (require, exports, sax) {
    function parse(content) {
        var errors = [];
        var currObject = null;
        var result = null;
        var text = null;
        var parser = sax.parser(false, { lowercase: true });
        parser.onerror = function (e) {
            errors.push(e.message);
        };
        parser.ontext = function (s) {
            text = s;
        };
        parser.onopentag = function (tag) {
            switch (tag.name) {
                case 'dict':
                    currObject = { parent: currObject, value: {} };
                    break;
                case 'array':
                    currObject = { parent: currObject, value: [] };
                    break;
                case 'key':
                    if (currObject) {
                        currObject.lastKey = null;
                    }
                    break;
            }
            text = '';
        };
        parser.onclosetag = function (tagName) {
            var value;
            switch (tagName) {
                case 'key':
                    if (!currObject || Array.isArray(currObject.value)) {
                        errors.push('key can only be used inside an open dict element');
                        return;
                    }
                    currObject.lastKey = text;
                    return;
                case 'dict':
                case 'array':
                    if (!currObject) {
                        errors.push(tagName + ' closing tag found, without opening tag');
                        return;
                    }
                    value = currObject.value;
                    currObject = currObject.parent;
                    break;
                case 'string':
                case 'data':
                    value = text;
                    break;
                case 'date':
                    value = new Date(text);
                    break;
                case 'integer':
                    value = parseInt(text);
                    if (isNaN(value)) {
                        errors.push(text + ' is not a integer');
                        return;
                    }
                    break;
                case 'real':
                    value = parseFloat(text);
                    if (isNaN(value)) {
                        errors.push(text + ' is not a float');
                        return;
                    }
                    break;
                case 'true':
                    value = true;
                    break;
                case 'false':
                    value = false;
                    break;
                case 'plist':
                    return;
                default:
                    errors.push('Invalid tag name: ' + tagName);
                    return;
            }
            if (!currObject) {
                result = value;
            }
            else if (Array.isArray(currObject.value)) {
                currObject.value.push(value);
            }
            else {
                if (currObject.lastKey) {
                    currObject.value[currObject.lastKey] = value;
                }
                else {
                    errors.push('Dictionary key missing for value ' + value);
                }
            }
        };
        parser.write(content);
        return { errors: errors, value: result };
    }
    exports.parse = parse;
});
//# sourceMappingURL=plist.js.map