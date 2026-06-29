package com.ideaplatform.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    private static final String BEARER = "bearer-jwt";

    @Bean
    public OpenAPI geistesblitzOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Geistesblitz API")
                        .version("0.1.0")
                        .description("""
                                Mandantenfähige Ideenmanagement-Plattform — REST-API.

                                **Anmelden:** `POST /api/auth/login` mit einer Demo-Adresse \
                                (z. B. `timo@fom.de`, Passwort `demo1234`) liefert ein JWT. \
                                Das Token oben rechts unter **Authorize** eintragen, dann lassen sich \
                                die geschützten Endpunkte direkt ausprobieren."""))
                .servers(List.of(new Server().url("/").description("Lokale Instanz")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER))
                .components(new Components().addSecuritySchemes(BEARER,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT aus POST /api/auth/login (ohne \"Bearer \"-Präfix einfügen).")));
    }
}
