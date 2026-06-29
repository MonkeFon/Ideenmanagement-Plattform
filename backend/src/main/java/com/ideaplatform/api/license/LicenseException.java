package com.ideaplatform.api.license;

public class LicenseException extends RuntimeException {
    private final String reason;
    public LicenseException(String reason, String message) {
        super(message);
        this.reason = reason;
    }
    public String reason() { return reason; }
}
