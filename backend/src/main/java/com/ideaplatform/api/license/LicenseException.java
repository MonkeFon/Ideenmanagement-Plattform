package com.ideaplatform.api.license;

/** 402 Payment Required — a license / plan check failed. */
public class LicenseException extends RuntimeException {
    private final String reason;
    public LicenseException(String reason, String message) {
        super(message);
        this.reason = reason;
    }
    public String reason() { return reason; }
}
