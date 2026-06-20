package com.xxx.treehole.common;

import lombok.Getter;

/**
 * 业务异常：敏感词命中、重复点赞、参数业务错等。
 * 默认 code=400。
 */
@Getter
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
}
