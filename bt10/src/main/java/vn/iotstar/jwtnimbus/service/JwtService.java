package vn.iotstar.jwtnimbus.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Cung cap cac ham tuong duong JwtService trong bai giang,
 * nhung phan tao/ky/doc/verify JWT duoc thuc hien bang Nimbus JOSE + JWT.
 */
@Service
public class JwtService {

    private final byte[] secretKey;
    private final long jwtExpiration;

    public JwtService(
            @Value("${security.jwt.secret-key}") String secretKey,
            @Value("${security.jwt.expiration-time}") long jwtExpiration) {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("HS256 secret key must be at least 32 bytes");
        }
        this.secretKey = keyBytes;
        this.jwtExpiration = jwtExpiration;
    }

    public String extractUsername(String token) {
        return extractClaim(token, JWTClaimsSet::getSubject);
    }

    public <T> T extractClaim(String token, Function<JWTClaimsSet, T> claimsResolver) {
        JWTClaimsSet claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    public long getExpirationTime() {
        return jwtExpiration;
    }

    private String buildToken(Map<String, Object> extraClaims,
                              UserDetails userDetails,
                              long expiration) {
        Instant now = Instant.now();

        JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                .subject(userDetails.getUsername())
                .issuer("jwt-nimbus-demo")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusMillis(expiration)));

        for (Map.Entry<String, Object> entry : extraClaims.entrySet()) {
            claimsBuilder.claim(entry.getKey(), entry.getValue());
        }

        List<String> authorities = userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .toList();
        claimsBuilder.claim("authorities", authorities);

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.HS256)
                        .type(JOSEObjectType.JWT)
                        .build(),
                claimsBuilder.build()
        );

        try {
            signedJWT.sign(new MACSigner(secretKey));
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Cannot sign JWT with Nimbus", e);
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username != null
                    && username.equals(userDetails.getUsername())
                    && verifySignature(token)
                    && !isTokenExpired(token);
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, JWTClaimsSet::getExpirationTime);
        return expiration == null || expiration.before(new Date());
    }

    private JWTClaimsSet extractAllClaims(String token) {
        try {
            return SignedJWT.parse(token).getJWTClaimsSet();
        } catch (ParseException e) {
            throw new IllegalArgumentException("JWT is invalid", e);
        }
    }

    private boolean verifySignature(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return JWSAlgorithm.HS256.equals(signedJWT.getHeader().getAlgorithm())
                    && signedJWT.verify(new MACVerifier(secretKey));
        } catch (ParseException | JOSEException e) {
            return false;
        }
    }
}
