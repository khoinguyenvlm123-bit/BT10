package vn.iotstar.jwtnimbus.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleSecurityException(Exception exception) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = "Unknown internal server error.";

        if (exception instanceof BadCredentialsException) {
            status = HttpStatus.UNAUTHORIZED;
            message = "The username or password is incorrect";
        } else if (exception instanceof AccountStatusException) {
            status = HttpStatus.FORBIDDEN;
            message = "The account is locked";
        } else if (exception instanceof AccessDeniedException) {
            status = HttpStatus.FORBIDDEN;
            message = "You are not authorized to access this resource";
        } else if (exception instanceof IllegalArgumentException) {
            status = HttpStatus.UNAUTHORIZED;
            message = exception.getMessage() == null ? "The JWT signature is invalid" : exception.getMessage();
        }

        Map<String, Object> errorDetail = new LinkedHashMap<>();
        errorDetail.put("status", status.value());
        errorDetail.put("message", message);
        errorDetail.put("description", exception.getMessage());

        return ResponseEntity.status(status).body(errorDetail);
    }
}
