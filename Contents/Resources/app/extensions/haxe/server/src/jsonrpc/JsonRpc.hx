package jsonrpc;

import jsonrpc.Types;

/**
    This class provides helper methods for creating JSON-RPC messages.
**/
class JsonRpc {
    static inline var PROTOCOL_VERSION = "2.0";
    public static inline var CANCEL_METHOD = "$/cancelRequest";

    /**
        Create `NotificationMessage` for given `method` and `params`.
    **/
    public static function notification<D>(method:String, ?params:D):NotificationMessage {
        var message:NotificationMessage = {
            jsonrpc: PROTOCOL_VERSION,
            method: method
        };
        if (params != null)
            message.params = params;
        return message;
    }

    /**
        Create `RequestMessage` for given `id`, `method` and `params`.
    **/
    public static function request<D>(id:RequestId, method:String, ?params:D):RequestMessage {
        var message:RequestMessage = {
            jsonrpc: PROTOCOL_VERSION,
            id: id,
            method: method
        };
        if (params != null)
            message.params = params;
        return message;
    }

    /**
        Create cancellation notification for given request `id`.
    **/
    public static inline function cancel(id:RequestId):NotificationMessage {
        return notification(CANCEL_METHOD, ({id: id} : CancelParams));
    }

    /**
        Create `ResponseMessage` for given request `id`.
    **/
    public static function response<D,E>(id:RequestId, result:D, error:ResponseError<E>):ResponseMessage {
        var response:ResponseMessage = {
            jsonrpc: PROTOCOL_VERSION,
            id: id,
        };
        if (error != null)
            response.error = error;
        else
            response.result = result;
        return response;
    }

    /**
        Create `ResponseError`  for given `code`, `message` and `data`.
    **/
    public static function error<T>(code:Int, message:String, ?data:T):ResponseError<T> {
        var error:ResponseError<T> = {
            code: code,
            message: message,
        };
        if (data != null)
            error.data = data;
        return error;
    }
}

/**
    Parameters for request cancellation notification.
**/
private typedef CancelParams = {
    /**
        The request id to cancel.
    **/
    var id:RequestId;
}
