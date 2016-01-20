/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports"], function (require, exports) {
    exports.TOKEN_HEADER_LEAD = 'entity.name.type';
    exports.TOKEN_HEADER = 'entity.name.type';
    exports.TOKEN_EXT_HEADER = 'entity.other.atribute-name';
    exports.TOKEN_SEPARATOR = 'meta.separator';
    exports.TOKEN_QUOTE = 'comment';
    exports.TOKEN_LIST = 'keyword';
    exports.TOKEN_BLOCK = 'string';
    exports.TOKEN_BLOCK_CODE = 'variable.source';
});
/*
// old settings
export const TOKEN_HEADER_LEAD = 'white';
export const TOKEN_HEADER = 'keyword.1';
export const TOKEN_EXT_HEADER = 'keyword.header';
export const TOKEN_SEPARATOR = 'keyword.header';
export const TOKEN_QUOTE = 'comment';
export const TOKEN_LIST = 'string.list';
export const TOKEN_BLOCK = 'variable';
export const TOKEN_BLOCK_CODE = 'variable.code';
*/ 
//# sourceMappingURL=markdownTokenTypes.js.map