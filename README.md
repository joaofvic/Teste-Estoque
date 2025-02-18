# Sistema de Gestão de Estoque

Um sistema web moderno e responsivo para gestão e controle de estoque, desenvolvido com HTML, CSS e JavaScript.

## 🚀 Funcionalidades

- **Dashboard Intuitivo**
  - Visão geral do estoque
  - Gráficos e métricas em tempo real
  - Alertas de estoque baixo
  - Atividades recentes

- **Gestão de Produtos**
  - Cadastro e edição de produtos
  - Upload de imagens
  - Categorização
  - Controle de quantidade
  - Histórico de movimentações

- **Controle de Acesso**
  - Sistema de login seguro
  - Diferentes níveis de usuário
  - Autenticação JWT
  - Proteção de rotas

- **Interface Responsiva**
  - Design adaptável a diferentes dispositivos
  - UX/UI moderna e intuitiva
  - Componentes reutilizáveis
  - Feedback visual para ações

## 🛠️ Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5.3
- Chart.js
- Bootstrap Icons

## 📦 Estrutura do Projeto

```
├── css/
│   └── styles.css          # Estilos globais
├── js/
│   └── main.js            # JavaScript principal
├── img/                   # Imagens e assets
├── pages/                 # Páginas do sistema
│   ├── login.html
│   ├── dashboard.html
│   └── products.html
├── components/           # Componentes reutilizáveis
├── index.html           # Página inicial
└── README.md           # Documentação
```

## 🚀 Como Usar

1. Clone o repositório:
```bash
git clone https://seu-repositorio/stock-control.git
```

2. Abra o arquivo `index.html` em um servidor web local

3. Credenciais de teste:
- Email: admin@exemplo.com
- Senha: admin123

## 📋 Requisitos

- Navegador web moderno com suporte a ES6+
- Servidor web local (recomendado)
- Conexão com internet (para CDNs)

## 🔒 Segurança

- Autenticação via JWT
- Validação de formulários
- Sanitização de inputs
- HTTPS recomendado
- Proteção contra XSS

## 🎨 Personalização

O sistema utiliza variáveis CSS que podem ser facilmente personalizadas em `css/styles.css`:

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #1e40af;
    /* ... outras variáveis ... */
}
```

## 📱 Responsividade

O sistema é totalmente responsivo e se adapta a diferentes tamanhos de tela:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- Email: suporte@exemplo.com
- Issues: https://github.com/seu-usuario/stock-control/issues

## 🎉 Agradecimentos

- Bootstrap Team
- Chart.js Team
- Bootstrap Icons
- Comunidade Open Source 