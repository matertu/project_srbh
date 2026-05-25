package com.srbh.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class TestController {

    private final RestTemplate supabaseRestTemplate;

    public TestController(RestTemplate supabaseRestTemplate) {
        this.supabaseRestTemplate = supabaseRestTemplate;
    }

    @GetMapping("/api/test-supabase")
    public String testConnection() {
        try {
            String response = supabaseRestTemplate.getForObject("/funcionarios?select=nome_func&limit=1", String.class);
            return "Sucesso Absoluto! O Spring Boot conectou no Supabase e encontrou isso: " + response;
        } catch (Exception e) {
            return "Erro ao conectar: " + e.getMessage();
        }
    }
}
