package com.srbh.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RestTemplate supabaseRestTemplate;

    public AuthController(RestTemplate supabaseRestTemplate) {
        this.supabaseRestTemplate = supabaseRestTemplate;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String senha = credentials.get("senha");

        if (email == null || senha == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "E-mail e senha são obrigatórios."));
        }

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> response = supabaseRestTemplate.getForObject(
                "/funcionarios?login_func=eq." + email + "&select=*", 
                List.class
            );

            if (response == null || response.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                     .body(Map.of("error", "Usuário não encontrado."));
            }

            Map<String, Object> funcionario = response.get(0);

            // Valida a senha
            if (!senha.equals(funcionario.get("senha_func"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                     .body(Map.of("error", "Senha incorreta."));
            }
            funcionario.remove("senha_func");
            
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Login realizado com sucesso");
            body.put("usuario", funcionario);

            return ResponseEntity.ok(body);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Erro interno no servidor ao conectar com o banco."));
        }
    }

    @PostMapping("/recuperar-senha")
    public ResponseEntity<?> recuperarSenha(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "O e-mail é obrigatório."));
        }

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> response = supabaseRestTemplate.getForObject(
                "/funcionarios?login_func=eq." + email + "&select=senha_func,nome_func", 
                List.class
            );

            if (response == null || response.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                     .body(Map.of("error", "E-mail não encontrado na base de dados."));
            }

            Map<String, Object> funcionario = response.get(0);
            String senha = (String) funcionario.get("senha_func");
            
            // Aqui futuramente entra o JavaMailSender para enviar o e-mail real para o Gmail!
            // Por enquanto o Back-end está devolvendo a senha de volta para simulação.

            return ResponseEntity.ok(Map.of(
                "message", "Simulação backend de envio de e-mail concluída.",
                "senha", senha,
                "real_email", false
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Erro ao processar recuperação de senha."));
        }
    }
}
