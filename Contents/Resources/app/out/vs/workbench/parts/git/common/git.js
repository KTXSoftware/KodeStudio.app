/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
define(["require", "exports", 'vs/platform/instantiation/common/instantiation'], function (require, exports, instantiation_1) {
    // Model enums
    (function (StatusType) {
        StatusType[StatusType["INDEX"] = 0] = "INDEX";
        StatusType[StatusType["WORKING_TREE"] = 1] = "WORKING_TREE";
        StatusType[StatusType["MERGE"] = 2] = "MERGE";
    })(exports.StatusType || (exports.StatusType = {}));
    var StatusType = exports.StatusType;
    (function (Status) {
        Status[Status["INDEX_MODIFIED"] = 0] = "INDEX_MODIFIED";
        Status[Status["INDEX_ADDED"] = 1] = "INDEX_ADDED";
        Status[Status["INDEX_DELETED"] = 2] = "INDEX_DELETED";
        Status[Status["INDEX_RENAMED"] = 3] = "INDEX_RENAMED";
        Status[Status["INDEX_COPIED"] = 4] = "INDEX_COPIED";
        Status[Status["MODIFIED"] = 5] = "MODIFIED";
        Status[Status["DELETED"] = 6] = "DELETED";
        Status[Status["UNTRACKED"] = 7] = "UNTRACKED";
        Status[Status["IGNORED"] = 8] = "IGNORED";
        Status[Status["ADDED_BY_US"] = 9] = "ADDED_BY_US";
        Status[Status["ADDED_BY_THEM"] = 10] = "ADDED_BY_THEM";
        Status[Status["DELETED_BY_US"] = 11] = "DELETED_BY_US";
        Status[Status["DELETED_BY_THEM"] = 12] = "DELETED_BY_THEM";
        Status[Status["BOTH_ADDED"] = 13] = "BOTH_ADDED";
        Status[Status["BOTH_DELETED"] = 14] = "BOTH_DELETED";
        Status[Status["BOTH_MODIFIED"] = 15] = "BOTH_MODIFIED";
    })(exports.Status || (exports.Status = {}));
    var Status = exports.Status;
    // Model events
    exports.ModelEvents = {
        MODEL_UPDATED: 'ModelUpdated',
        STATUS_MODEL_UPDATED: 'StatusModelUpdated',
        HEAD_UPDATED: 'HEADUpdated',
        HEADS_UPDATED: 'HEADSUpdated',
        TAGS_UPDATED: 'TagsUpdated',
        REMOTES_UPDATED: 'RemotesUpdated'
    };
    // Service enums
    (function (ServiceState) {
        ServiceState[ServiceState["NotInitialized"] = 0] = "NotInitialized";
        ServiceState[ServiceState["NotARepo"] = 1] = "NotARepo";
        ServiceState[ServiceState["NotAtRepoRoot"] = 2] = "NotAtRepoRoot";
        ServiceState[ServiceState["OK"] = 3] = "OK";
        ServiceState[ServiceState["NoGit"] = 4] = "NoGit";
        ServiceState[ServiceState["Disabled"] = 5] = "Disabled";
        ServiceState[ServiceState["NotAWorkspace"] = 6] = "NotAWorkspace";
    })(exports.ServiceState || (exports.ServiceState = {}));
    var ServiceState = exports.ServiceState;
    (function (RawServiceState) {
        RawServiceState[RawServiceState["OK"] = 0] = "OK";
        RawServiceState[RawServiceState["GitNotFound"] = 1] = "GitNotFound";
        RawServiceState[RawServiceState["Disabled"] = 2] = "Disabled";
    })(exports.RawServiceState || (exports.RawServiceState = {}));
    var RawServiceState = exports.RawServiceState;
    exports.GitErrorCodes = {
        BadConfigFile: 'BadConfigFile',
        AuthenticationFailed: 'AuthenticationFailed',
        NoUserNameConfigured: 'NoUserNameConfigured',
        NoUserEmailConfigured: 'NoUserEmailConfigured',
        NoRemoteRepositorySpecified: 'NoRemoteRepositorySpecified',
        NotAGitRepository: 'NotAGitRepository',
        NotAtRepositoryRoot: 'NotAtRepositoryRoot',
        Conflict: 'Conflict',
        UnmergedChanges: 'UnmergedChanges',
        PushRejected: 'PushRejected',
        RemoteConnectionError: 'RemoteConnectionError',
        DirtyWorkTree: 'DirtyWorkTree',
        CantOpenResource: 'CantOpenResource',
        GitNotFound: 'GitNotFound',
        CantCreatePipe: 'CantCreatePipe',
        CantAccessRemote: 'CantAccessRemote',
        RepositoryNotFound: 'RepositoryNotFound'
    };
    (function (AutoFetcherState) {
        AutoFetcherState[AutoFetcherState["Disabled"] = 0] = "Disabled";
        AutoFetcherState[AutoFetcherState["Inactive"] = 1] = "Inactive";
        AutoFetcherState[AutoFetcherState["Active"] = 2] = "Active";
        AutoFetcherState[AutoFetcherState["Fetching"] = 3] = "Fetching";
    })(exports.AutoFetcherState || (exports.AutoFetcherState = {}));
    var AutoFetcherState = exports.AutoFetcherState;
    // Service events
    exports.ServiceEvents = {
        STATE_CHANGED: 'stateChanged',
        REPO_CHANGED: 'repoChanged',
        OPERATION_START: 'operationStart',
        OPERATION_END: 'operationEnd',
        OPERATION: 'operation',
        ERROR: 'error',
        DISPOSE: 'dispose'
    };
    // Service operations
    exports.ServiceOperations = {
        STATUS: 'status',
        INIT: 'init',
        ADD: 'add',
        STAGE: 'stage',
        BRANCH: 'branch',
        CHECKOUT: 'checkout',
        CLEAN: 'clean',
        UNDO: 'undo',
        RESET: 'reset',
        COMMIT: 'commit',
        COMMAND: 'command',
        BACKGROUND_FETCH: 'backgroundfetch',
        PULL: 'pull',
        PUSH: 'push',
        SYNC: 'sync'
    };
    exports.GIT_SERVICE_ID = 'gitService';
    exports.IGitService = instantiation_1.createDecorator(exports.GIT_SERVICE_ID);
    // Utils
    function isValidBranchName(value) {
        return !/^\.|\/\.|\.\.|~|\^|:|\/$|\.lock$|\.lock\/|\\|\*|\s|^\s*$/.test(value);
    }
    exports.isValidBranchName = isValidBranchName;
});
//# sourceMappingURL=git.js.map