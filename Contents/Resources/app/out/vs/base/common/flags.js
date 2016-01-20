/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/base/common/platform'], function (require, exports, platform_1) {
    exports.workersCount = environment('workersCount', 2);
    exports.enableTasks = environment('enableTasks');
    exports.enableSendASmile = environment('enableSendASmile');
    exports.enableJavaScriptRewriting = environment('enableJavaScriptRewriting');
    exports.enableTypeScriptServiceMode = environment('enableTypeScriptServiceMode');
    exports.enableTypeScriptServiceModeForJS = environment('enableTypeScriptServiceModeForJS');
    // Telemetry endpoint (used in the standalone editor) for hosts that want to collect editor telemetry
    exports.standaloneEditorTelemetryEndpoint = environment('telemetryEndpoint', null);
    // Option for hosts to overwrite the worker script url (used in the standalone editor)
    exports.getCrossOriginWorkerScriptUrl = environment('getWorkerUrl', null);
    function environment(name, fallback) {
        if (fallback === void 0) { fallback = false; }
        if (platform_1.globals.MonacoEnvironment && platform_1.globals.MonacoEnvironment.hasOwnProperty(name)) {
            return platform_1.globals.MonacoEnvironment[name];
        }
        return fallback;
    }
});
//# sourceMappingURL=flags.js.map