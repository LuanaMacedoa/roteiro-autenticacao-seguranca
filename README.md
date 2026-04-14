# Sistema Seguro: Autenticação e CRUD de Refugiados

## Integrantes

* Luana Gabriella
* Vinicius Ares
* Maria Laura
* Gustavo Almeida
* Luis Eduardo

## Descrição

Sistema completo de autenticação e gerenciamento de dados de refugiados, desenvolvido para a disciplina de Segurança da Informação no IFPB. O projeto implementa boas práticas de segurança com hash SHA-256, validação robusta, controle de sessão e CRUD operacional.

## Funcionalidades Principais

### Autenticação & Cadastro

* **Cadastro de Usuário**: Email + Senha com validação forte
* **Login**: Autenticação com hash de senha (nunca armazena texto plano)
* **Controle de Sessão**: SessionStorage para manter estado do usuário logado
* **Logout**: Limpa sessão e retorna para login

### CRUD de Refugiados

* **Create**: Adicionar novo refugiado (nome, endereço, idade, religião, ideologia, profissão, filhos, renda, escolaridade)
* **Read**: Visualizar tabela com todos os refugiados do usuário
* **Update**: Editar informações de um refugiado
* **Delete**: Remover registros

### Segurança Implementada

* **Hash SHA-256 com Salt**: Cada cadastro gera um salt único, senha nunca é salva em texto plano
* **Validação de Email**: Regex para detectar formato inválido
* **Força de Senha**: Exige 8+ caracteres, maiúscula, número, caractere especial
* **Blacklist de Senhas**: Rejeita senhas comuns ("123456", "password", "admin", etc.)
* **Isolamento de Dados**: Cada usuário tem seus próprios refugiados isolados por email
* **Validação de Campos**: Whitelists para selects (religião, ideologia)

### Design & UX
* **Layout Responsivo**: Funciona em desktop, tablet e mobile
* **Tema Consistente**: Cores harmoniosas e tipografia legível
* **Animações Suaves**: Transições fadeIn/slideUp para melhor experiência
* **Header e Footer Unificados**: Navegação consistente em todas as páginas
* **Background com Imagem**: Overlay com foto profissional do Unsplash

## Tecnologias

* **HTML5**: Estrutura semântica
* **CSS3**: Grid Layout, Flexbox, Media Queries, Gradientes, Animations
* **JavaScript (Vanilla)**: Web Crypto API (SHA-256), localStorage, sessionStorage
* **Sem frameworks**: Implementação pura (vanilla) para máximo controle

## Estrutura de Pastas

```
roteiro-autenticacao-seguranca/
├── index.html                    # Página inicial/landing
├── style.css                     # Estilos globais (se houver)
├── script.js                     # Scripts globais (se houver)
│
└── pages/
    ├── login/
    │   ├── login.html           # Formulário de login
    │   ├── login.css            # Estilos do login
    │   └── login.js             # Lógica de autenticação
    │
    ├── cadastro/
    │   ├── cadastro.html        # Formulário de cadastro
    │   ├── cadastro.css         # Estilos do cadastro
    │   └── cadastro.js          # Lógica de validação + hash
    │
    └── sistema/
        ├── sistema.html         # Interface CRUD
        ├── sistema.css          # Estilos do CRUD
        └── sistema.js           # Lógica de gerenciamento de dados
```

---
