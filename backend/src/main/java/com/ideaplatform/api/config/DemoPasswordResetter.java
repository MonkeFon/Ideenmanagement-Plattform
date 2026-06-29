package com.ideaplatform.api.config;

import com.ideaplatform.api.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("postgres")
@Order(10)
public class DemoPasswordResetter implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoPasswordResetter.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final boolean enabled;
    private final String demoPassword;

    public DemoPasswordResetter(UserRepository users, PasswordEncoder encoder,
                                @Value("${ideaplatform.demo.reset-passwords:true}") boolean enabled,
                                @Value("${ideaplatform.demo.password:demo1234}") String demoPassword) {
        this.users = users;
        this.encoder = encoder;
        this.enabled = enabled;
        this.demoPassword = demoPassword;
    }

    @Override
    public void run(String... args) {
        if (!enabled) return;
        String hash = encoder.encode(demoPassword);
        int n = 0;
        for (var u : users.findAll()) {

            String email = u.getEmail();
            if (email.endsWith(".test") || email.endsWith("@fom.de")) {
                u.setPasswordHash(hash);
                users.save(u);
                n++;
            }
        }
        log.info("Demo password reset for {} demo accounts (password='{}')", n, demoPassword);
    }
}
