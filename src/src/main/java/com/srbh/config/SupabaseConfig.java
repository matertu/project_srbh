package com.srbh.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;

@Configuration
public class SupabaseConfig {

    // Lê os valores diretamente do application.properties
    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Bean
    public RestTemplate supabaseRestTemplate(RestTemplateBuilder builder) {
        return builder
            .rootUri(supabaseUrl + "/rest/v1")
            .defaultHeader("apikey", supabaseKey)
            .defaultHeader("Authorization", "Bearer " + supabaseKey)
            .defaultHeader("Content-Type", "application/json")
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(5))
            .build();
    }
}
