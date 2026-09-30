package vn.iotstar.jwtnimbus.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.iotstar.jwtnimbus.entity.User;
import vn.iotstar.jwtnimbus.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDemoUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail("user@gmail.com")) {
                User user = new User();
                user.setFullName("Nguyen Van A");
                user.setEmail("user@gmail.com");
                user.setPassword(passwordEncoder.encode("123456"));
                user.setRole("USER");
                user.setImages("user.svg");
                userRepository.save(user);
            }
        };
    }
}
