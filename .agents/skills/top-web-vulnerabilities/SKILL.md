---
name: top-web-vulnerabilities
description: Esta skill orienta a verificação de vulnerabilidades web com base nas diretrizes do OWASP Top 10, focando em testes de XSS, Autenticação, Controle de Acesso, Headers de Segurança e geração de relatórios de vulnerabilidade.
---

# Skill: Top Web Vulnerabilities (OWASP Knowledge)

Esta skill fornece diretrizes e metodologias para verificar e testar vulnerabilidades em aplicações web, alinhadas com o OWASP Top 10. Ela orienta o agente a identificar brechas de segurança comuns e a reportá-las de maneira estruturada.

## 🚀 Fluxo de Testes e Fases

### Phase 3: XSS Testing

Cross-Site Scripting (XSS) ocorre quando dados não confiáveis são inseridos em uma página web sem validação ou sanitização adequada, permitindo a execução de scripts maliciosos no navegador do usuário.

#### Actions
1.  **Test reflected XSS:** Submeter payloads de teste em parâmetros de URL, campos de busca e formulários cuja resposta seja imediatamente renderizada na página.
2.  **Test stored XSS:** Inserir payloads em campos que persistem dados no banco de dados (ex: comentários, perfis de usuário) e verificar se o script é executado ao carregar a página para outros usuários.
3.  **Test DOM-based XSS:** Analisar fontes de entrada controladas pelo usuário no lado do cliente (como `location.search`, `document.referrer`) e sinks inseguros (como `element.innerHTML`, `eval()`).
4.  **Test XSS filters:** Avaliar se mecanismos de defesa (ex: WAF, sanitização por regex) podem ser burlados usando codificações alternativas ou payloads específicos.
5.  **Document findings:** Registrar as entradas vulneráveis, payloads funcionais e o impacto da execução do script.

---

### Phase 4: Authentication Testing

Testes focados em identificar falhas na autenticação e gestão de sessão de usuários que possam permitir a personificação de contas.

#### Actions
1.  **Test credential stuffing:** Verificar a ausência de mecanismos de limitação de taxa (rate limiting) em endpoints de login usando credenciais comuns.
2.  **Test brute force protection:** Validar se há bloqueio temporário de conta ou exigência de CAPTCHA após múltiplas tentativas consecutivas de login malsucedidas.
3.  **Test session management:** Inspecionar a segurança dos tokens de sessão (ex: cookies com flags `HttpOnly`, `Secure`, `SameSite`, ou tokens JWT expirados/fracos).
4.  **Test password policies:** Verificar se o sistema impõe requisitos mínimos de complexidade e comprimento de senha.
5.  **Test MFA implementation:** Avaliar a robustez e integridade da verificação em duas etapas, testando desvios (bypass) comuns.

---

### Phase 5: Access Control Testing

Garantir que os usuários não possam acessar recursos ou executar funções fora das suas permissões atribuídas.

#### Actions
1.  **Test vertical privilege escalation:** Tentar acessar endpoints administrativos ou APIs restritas usando uma conta de nível de permissão inferior (ex: usuário comum acessando rotas de admin).
2.  **Test horizontal privilege escalation:** Tentar acessar ou modificar recursos de outros usuários com o mesmo nível de privilégio (ex: alterar dados de outra conta via requisições manipuladas).
3.  **Test IDOR vulnerabilities:** Manipular identificadores em URLs, parâmetros ou cabeçalhos de requisição (como IDs numéricos sequenciais) para acessar dados não autorizados.
4.  **Test directory traversal:** Submeter sequências de escape de caminho (como `../`) em parâmetros de arquivo para acessar arquivos confidenciais fora da raiz da aplicação.
5.  **Test unauthorized access:** Testar o acesso direto a páginas e recursos estáticos sem estar devidamente autenticado.

---

### Phase 6: Security Headers

Auditar os cabeçalhos de resposta HTTP para garantir que estão configurados de forma a mitigar ataques comuns de cliente.

#### Actions
1.  **Check CSP implementation:** Validar a diretiva `Content-Security-Policy` para garantir que restringe adequadamente a execução de scripts e carregamento de recursos externos.
2.  **Verify HSTS configuration:** Verificar a presença e validade do cabeçalho `Strict-Transport-Security` para impor conexões HTTPS seguras.
3.  **Test X-Frame-Options:** Garantir que o cabeçalho está definido como `DENY` ou `SAMEORIGIN` para mitigar ataques de Clickjacking.
4.  **Check X-Content-Type-Options:** Certificar-se de que o cabeçalho está definido como `nosniff` para evitar ataques de farejamento de tipo MIME (MIME-sniffing).
5.  **Verify referrer policy:** Validar o cabeçalho `Referrer-Policy` para evitar o vazamento de informações confidenciais em URLs de referência.

---

### Phase 7: Reporting

Documentar os resultados dos testes de segurança para que possam ser compreendidos e corrigidos pela equipe de desenvolvimento.

#### Actions
1.  **Document vulnerabilities:** Registrar detalhadamente cada vulnerabilidade encontrada, incluindo descrição, passos para reproduzir e impacto.
2.  **Assess risk levels:** Classificar as vulnerabilidades usando uma escala de severidade (ex: Crítica, Alta, Média, Baixa) com base em métricas como facilidade de exploração e impacto ao negócio.
3.  **Provide remediation:** Indicar soluções técnicas claras e acionáveis para corrigir as vulnerabilidades documentadas.
4.  **Create proof of concept (PoC):** Desenvolver um exemplo simplificado ou captura de tela que demonstre a viabilidade da exploração segura da falha.
5.  **Generate report:** Consolidar todas as informações em um relatório de segurança técnico estruturado.

---

## 📋 OWASP Top 10 Checklist

O agente deve validar sistematicamente cada um dos seguintes itens:

- [ ] **A01: Broken Access Control:** Restrições de acesso a dados e funções não são devidamente aplicadas.
- [ ] **A02: Cryptographic Failures:** Proteção inadequada de dados confidenciais em repouso ou em trânsito.
- [ ] **A03: Injection:** Dados não confiáveis são enviados para um interpretador como parte de um comando ou consulta (ex: SQL, NoSQL, HTML, OS Command).
- [ ] **A04: Insecure Design:** Falhas de arquitetura e design de software que introduzem vulnerabilidades estruturais.
- [ ] **A05: Security Misconfiguration:** Configurações de segurança incorretas ou ausentes em servidores, frameworks ou componentes.
- [ ] **A06: Vulnerable Components:** Uso de dependências, bibliotecas ou sistemas conhecidos como vulneráveis ou desatualizados.
- [ ] **A07: Authentication Failures:** Falhas na identificação de usuários, gerenciamento de credenciais e controle de sessões.
- [ ] **A08: Software/Data Integrity:** Falhas ao assumir a integridade de códigos ou dados sem verificar assinaturas ou hashes (ex: desserialização insegura).
- [ ] **A09: Logging/Monitoring:** Registro ineficiente de logs e monitoramento de atividades suspeitas, dificultando a detecção e resposta a incidentes.
- [ ] **A10: SSRF (Server-Side Request Forgery):** Aplicação induzida a fazer requisições HTTP para destinos arbitrários ou internos.
