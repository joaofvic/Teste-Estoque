// Funções globais
window.editarProduto = function(id) {
    const produto = window.dbFunctions.obterProduto(id);
    if (produto) {
        document.getElementById('produtoId').value = produto.id;
        document.getElementById('produtoNome').value = produto.nome;
        document.getElementById('produtoCategoria').value = produto.categoria;
        document.getElementById('produtoQuantidade').value = produto.quantidade;
        document.getElementById('produtoPreco').value = produto.preco;
        
        document.getElementById('modalProdutoTitulo').textContent = 'Editar Produto';
        new bootstrap.Modal(document.getElementById('modalProduto')).show();
    }
};

window.removerProduto = function(id) {
    if (confirm('Tem certeza que deseja remover este produto?')) {
        window.dbFunctions.removerProduto(id);
        carregarProdutos();
    }
};

window.editarUsuario = function(id) {
    const usuarios = window.dbFunctions.listarUsuarios();
    const usuario = usuarios.find(u => u.id === id);
    if (usuario) {
        document.getElementById('usuarioId').value = usuario.id;
        document.getElementById('usuarioNome').value = usuario.nome;
        document.getElementById('usuarioEmail').value = usuario.email;
        document.getElementById('usuarioTipo').value = usuario.tipo;
        document.getElementById('usuarioSenha').value = '';
        
        document.getElementById('modalUsuarioTitulo').textContent = 'Editar Usuário';
        new bootstrap.Modal(document.getElementById('modalUsuario')).show();
    }
};

window.removerUsuario = function(id) {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
        window.dbFunctions.removerUsuario(id);
        carregarUsuarios();
    }
};

window.gerarRelatorios = function() {
    console.log('Gerando relatórios');
    const periodo = parseInt(document.getElementById('periodoRelatorio').value);
    const relatorioEstoque = window.dbFunctions.gerarRelatorioEstoque();
    
    document.getElementById('totalProdutos').textContent = relatorioEstoque.totalProdutos;
    document.getElementById('valorTotalEstoque').textContent = `R$ ${relatorioEstoque.valorTotalEstoque.toFixed(2)}`;
    document.getElementById('produtosBaixoEstoque').textContent = relatorioEstoque.produtosBaixoEstoque;

    const relatorioAtividades = window.dbFunctions.gerarRelatorioAtividades(periodo);
    document.getElementById('totalAtividades').textContent = relatorioAtividades.total;

    atualizarGraficoCategorias(relatorioEstoque.produtosPorCategoria);
    atualizarGraficoAtividades(relatorioAtividades.porStatus);

    const atividades = window.dbFunctions.listarAtividades({ 
        dataInicio: new Date(Date.now() - periodo * 24 * 60 * 60 * 1000) 
    });
    
    const tbody = document.getElementById('tabelaAtividades');
    if (tbody) {
        tbody.innerHTML = '';
        atividades.forEach(atividade => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${atividade.usuario}</td>
                <td>${atividade.acao}</td>
                <td>${atividade.data}</td>
                <td><span class="badge bg-${atividade.status === 'Concluído' ? 'success' : 'warning'}">${atividade.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
};

// Evento principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página carregada');

    // Formulário de login do usuário
    const userLoginForm = document.getElementById('userLoginForm');
    if (userLoginForm) {
        userLoginForm.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('userEmail').value;
            const password = document.getElementById('userPassword').value;
            
            console.log('Tentando login de usuário:', email);
            const usuario = window.dbFunctions.autenticar(email, password);
            
            if (usuario && usuario.tipo === 'usuario') {
                localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
                console.log('Login de usuário bem-sucedido, redirecionando...');
                window.location.href = 'dashboard-user.html';
            } else {
                alert('Credenciais inválidas!');
            }
        };
    }

    // Formulário de login do administrador
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            
            console.log('Tentando login de administrador:', email);
            const usuario = window.dbFunctions.autenticar(email, password);
            
            if (usuario && usuario.tipo === 'admin') {
                localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
                console.log('Login de administrador bem-sucedido, redirecionando...');
                window.location.href = 'dashboard-admin.html';
            } else {
                alert('Credenciais inválidas!');
            }
        };
    }

    // Função de logout
    const logoutButton = document.querySelector('a[href="index.html"]');
    if (logoutButton) {
        logoutButton.onclick = function(e) {
            e.preventDefault();
            // Remover apenas os dados de autenticação
            localStorage.removeItem('usuarioLogado');
            window.location.href = 'index.html';
        };
    }

    // Carregar dados específicos da página
    const paginaAtual = window.location.pathname;
    if (paginaAtual.includes('dashboard-admin')) {
        carregarDadosDashboard();
    } else if (paginaAtual.includes('dashboard-user')) {
        carregarDadosUsuario();
    } else if (paginaAtual.includes('produtos-admin')) {
        inicializarPaginaProdutos();
    } else if (paginaAtual.includes('usuarios-admin')) {
        inicializarPaginaUsuarios();
    } else if (paginaAtual.includes('relatorios-admin')) {
        inicializarPaginaRelatorios();
    }
});

function configurarFormulariosLogin() {
    // Formulário de login do usuário
    const userLoginForm = document.getElementById('userLoginForm');
    if (userLoginForm) {
        console.log('Formulário de usuário encontrado');
        userLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('userEmail').value;
            const password = document.getElementById('userPassword').value;
            
            console.log('Tentativa de login de usuário:', email);
            const resultado = window.dbFunctions.autenticar(email, password);
            console.log('Resultado da autenticação:', resultado);
            
            if (resultado && !resultado.erro) {
                if (resultado.tipo === 'usuario' || resultado.tipo === 'gerente') {
                    localStorage.setItem('usuarioLogado', JSON.stringify(resultado));
                    window.location.replace('dashboard-user.html');
                } else {
                    mostrarFeedback('Este usuário não tem permissão para acessar esta área.', 'warning');
                }
            } else {
                const mensagem = resultado?.erro || 'Credenciais inválidas!';
                mostrarFeedback(mensagem, 'danger');
            }
        });
    }

    // Formulário de login do administrador
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        console.log('Formulário de administrador encontrado');
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            
            console.log('Tentativa de login de administrador:', email);
            const resultado = window.dbFunctions.autenticar(email, password);
            console.log('Resultado da autenticação:', resultado);
            
            if (resultado && !resultado.erro) {
                if (resultado.tipo === 'admin') {
                    localStorage.setItem('usuarioLogado', JSON.stringify(resultado));
                    window.location.replace('dashboard-admin.html');
                } else {
                    mostrarFeedback('Este usuário não tem permissão para acessar a área administrativa.', 'warning');
                }
            } else {
                const mensagem = resultado?.erro || 'Credenciais inválidas!';
                mostrarFeedback(mensagem, 'danger');
            }
        });
    }
}

function verificarPermissao(permissao) {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    return usuarioLogado && usuarioLogado.nivel_acesso && usuarioLogado.nivel_acesso[permissao];
}

function verificarAutenticacao() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function redirecionarParaDashboard(tipo) {
    console.log('Redirecionando para dashboard:', tipo);
    if (tipo === 'admin') {
        window.location.replace('dashboard-admin.html');
    } else {
        window.location.replace('dashboard-user.html');
    }
}

function carregarDadosDashboard() {
    console.log('Carregando dados do dashboard admin');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    // Atualizar nome do usuário
    document.querySelector('h2').textContent = `Bem-vindo, ${usuarioLogado.nome}`;

    // Carregar produtos
    const produtos = window.dbFunctions.listarProdutos();
    document.querySelector('.card-text').textContent = produtos.length;

    // Carregar atividades recentes
    const atividades = window.dbFunctions.listarAtividades();
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';
    
    atividades.slice(0, 5).forEach(atividade => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${atividade.usuario}</td>
            <td>${atividade.acao}</td>
            <td>${atividade.data}</td>
            <td><span class="badge bg-${atividade.status === 'Concluído' ? 'success' : 'warning'}">${atividade.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function carregarDadosUsuario() {
    console.log('Carregando dados do dashboard usuário');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    
    // Atualizar nome do usuário
    document.querySelector('h2').textContent = `Bem-vindo, ${usuarioLogado.nome}`;

    // Carregar produtos
    const produtos = window.dbFunctions.listarProdutos();
    const listaProdutos = document.getElementById('listaProdutos');
    
    if (listaProdutos) {
        produtos.forEach(produto => {
            const col = document.createElement('div');
            col.className = 'col-md-4';
            col.innerHTML = `
                <div class="card product-card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${produto.nome}</h5>
                        <p class="card-text">
                            <strong>Quantidade:</strong> ${produto.quantidade}<br>
                            <strong>Preço:</strong> R$ ${produto.preco.toFixed(2)}<br>
                            <strong>Categoria:</strong> ${produto.categoria}
                        </p>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <button class="btn btn-sm btn-custom-primary w-100">Ver Detalhes</button>
                    </div>
                </div>
            `;
            listaProdutos.appendChild(col);
        });
    }
}

function inicializarPaginaProdutos() {
    console.log('Inicializando página de produtos');
    
    // Carregar produtos iniciais
    carregarProdutos();

    // Configurar eventos de filtro
    const pesquisaInput = document.getElementById('pesquisaProduto');
    const categoriaInput = document.getElementById('filtroCategoria');
    const estoqueSelect = document.getElementById('filtroEstoque');

    [pesquisaInput, categoriaInput, estoqueSelect].forEach(elemento => {
        if (elemento) {
            elemento.addEventListener('input', carregarProdutos);
        }
    });

    // Configurar modal de produto
    const modalProduto = document.getElementById('modalProduto');
    if (modalProduto) {
        const modal = new bootstrap.Modal(modalProduto);
        const salvarBtn = document.getElementById('salvarProduto');
        
        salvarBtn.addEventListener('click', () => {
            const produto = {
                nome: document.getElementById('produtoNome').value,
                categoria: document.getElementById('produtoCategoria').value,
                quantidade: 0, // Quantidade inicial sempre zero
                preco: parseFloat(document.getElementById('produtoPreco').value)
            };

            const produtoId = document.getElementById('produtoId').value;
            
            if (produtoId) {
                window.dbFunctions.atualizarProduto(parseInt(produtoId), produto);
            } else {
                window.dbFunctions.adicionarProduto(produto);
            }

            modal.hide();
            carregarProdutos();
            limparFormularioProduto();
        });
    }

    // Configurar modal de entrada de estoque
    const modalEntrada = document.getElementById('modalEntradaEstoque');
    if (modalEntrada) {
        const modal = new bootstrap.Modal(modalEntrada);
        const salvarBtn = document.getElementById('salvarEntrada');
        const codigoBarrasInput = document.getElementById('codigoBarras');
        const produtoSelect = document.getElementById('produtoEntrada');
        
        // Configurar eventos do campo de código de barras
        if (codigoBarrasInput) {
            // Evento para processar o código quando pressionar Enter
            codigoBarrasInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    processarCodigoBarras(this.value.trim());
                }
            });

            // Evento para processar o código quando o campo perder o foco
            codigoBarrasInput.addEventListener('blur', function() {
                const codigo = this.value.trim();
                if (codigo.length === 13) {
                    processarCodigoBarras(codigo);
                }
            });

            // Evento para processar o código após a digitação
            codigoBarrasInput.addEventListener('input', function() {
                const codigo = this.value.trim();
                if (codigo.length === 13) {
                    processarCodigoBarras(codigo);
                }
            });
        }

        // Carregar lista de produtos no select e histórico
        modalEntrada.addEventListener('show.bs.modal', () => {
            const select = document.getElementById('produtoEntrada');
            const produtos = window.dbFunctions.listarProdutos();
            
            select.innerHTML = '<option value="">Escolha um produto...</option>';
            produtos.forEach(produto => {
                select.innerHTML += `<option value="${produto.id}">${produto.nome} - ${produto.categoria}</option>`;
            });

            // Limpar campos
            codigoBarrasInput.value = '';
            document.getElementById('quantidadeEntrada').value = '';
            document.getElementById('observacaoEntrada').value = '';
            
            // Carregar histórico geral
            carregarHistoricoEntradas();
            atualizarDetalhesProduto(null);
        });

        // Atualizar histórico quando selecionar produto
        produtoSelect.addEventListener('change', function() {
            const produtoId = parseInt(this.value);
            if (produtoId) {
                carregarHistoricoEntradas(produtoId);
                atualizarDetalhesProduto(produtoId);
            } else {
                carregarHistoricoEntradas();
                atualizarDetalhesProduto(null);
            }
        });

        // Entrada manual
        salvarBtn.addEventListener('click', () => {
            const produtoId = parseInt(document.getElementById('produtoEntrada').value);
            const quantidade = parseInt(document.getElementById('quantidadeEntrada').value);
            const observacao = document.getElementById('observacaoEntrada').value;
            const codigoBarras = document.getElementById('codigoBarras').value.trim();

            if (!produtoId || !quantidade) {
                mostrarFeedback('Por favor, preencha todos os campos obrigatórios.', 'warning');
                return;
            }

            try {
                const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
                window.dbFunctions.registrarEntradaEstoque(
                    produtoId,
                    quantidade,
                    observacao,
                    usuarioLogado.id,
                    codigoBarras.length === 13 ? codigoBarras : null
                );

                // Atualizar interface
                carregarHistoricoEntradas(produtoId);
                atualizarDetalhesProduto(produtoId);
                carregarProdutos();
                
                // Limpar campos
                document.getElementById('quantidadeEntrada').value = '';
                document.getElementById('observacaoEntrada').value = '';
                document.getElementById('codigoBarras').value = '';

                mostrarFeedback('Entrada registrada com sucesso!', 'success');
            } catch (error) {
                mostrarFeedback('Erro ao registrar entrada: ' + error.message, 'danger');
            }
        });
    }
}

function processarCodigoBarras(codigo) {
    if (codigo.length !== 13) return;

    try {
        const produto = window.dbFunctions.obterProdutoPorCodigoBarras(codigo);
        if (produto) {
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            
            // Registrar entrada automática de 1 unidade
            window.dbFunctions.registrarEntradaEstoque(
                produto.id,
                1,
                'Entrada automática por código de barras individual',
                usuarioLogado.id,
                codigo
            );

            // Tocar beep de sucesso
            const beep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
            beep.play();

            // Atualizar interface
            carregarProdutos();
            carregarHistoricoEntradas(produto.id);
            atualizarDetalhesProduto(produto.id);

            // Selecionar o produto no select
            const produtoSelect = document.getElementById('produtoEntrada');
            if (produtoSelect) {
                produtoSelect.value = produto.id;
            }

            // Mostrar feedback
            mostrarFeedback(`+1 unidade adicionada a ${produto.nome}`, 'success', codigo);

            // Limpar campo
            const codigoBarrasInput = document.getElementById('codigoBarras');
            if (codigoBarrasInput) {
                codigoBarrasInput.value = '';
                codigoBarrasInput.focus();
            }
        } else {
            mostrarFeedback('Código de barras não registrado', 'warning');
        }
    } catch (error) {
        console.error('Erro ao processar código de barras:', error);
        mostrarFeedback('Erro ao processar código de barras', 'danger');
    }
}

function mostrarFeedback(mensagem, tipo) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    feedbackDiv.style.zIndex = "9999";
    feedbackDiv.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(feedbackDiv);
    
    // Remover automaticamente após 3 segundos
    setTimeout(() => {
        feedbackDiv.remove();
    }, 3000);
}

function carregarProdutos() {
    const filtros = {
        busca: document.getElementById('pesquisaProduto')?.value?.toLowerCase(),
        categoria: document.getElementById('filtroCategoria')?.value?.toLowerCase(),
        estoque: document.getElementById('filtroEstoque')?.value
    };

    const produtos = window.dbFunctions.listarProdutos(filtros);
    const tbody = document.getElementById('tabelaProdutos');
    
    if (tbody) {
        tbody.innerHTML = '';
        produtos.forEach(produto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${produto.id}</td>
                <td>${produto.nome}</td>
                <td>${produto.categoria}</td>
                <td>${produto.quantidade}</td>
                <td>R$ ${produto.preco.toFixed(2)}</td>
                <td>
                    <span class="badge bg-${getStatusEstoque(produto.quantidade).cor}">
                        ${getStatusEstoque(produto.quantidade).texto}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarProduto(${produto.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="removerProduto(${produto.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function getStatusEstoque(quantidade) {
    if (quantidade < 50) {
        return { texto: 'Baixo', cor: 'danger' };
    } else if (quantidade < 100) {
        return { texto: 'Normal', cor: 'success' };
    } else {
        return { texto: 'Alto', cor: 'primary' };
    }
}

function limparFormularioProduto() {
    document.getElementById('produtoId').value = '';
    document.getElementById('produtoNome').value = '';
    document.getElementById('produtoCategoria').value = '';
    document.getElementById('produtoSubcategoria').value = '';
    document.getElementById('produtoPreco').value = '';
    document.getElementById('produtoEstoqueMinimo').value = '';
    document.getElementById('produtoEstoqueMaximo').value = '';
    document.getElementById('produtoPrateleira').value = '';
    document.getElementById('produtoCorredor').value = '';
    document.getElementById('produtoPosicao').value = '';
    document.getElementById('modalProdutoTitulo').textContent = 'Novo Produto';
}

function inicializarPaginaUsuarios() {
    console.log('Inicializando página de usuários');
    
    // Carregar usuários iniciais
    carregarUsuarios();

    // Configurar eventos de filtro
    const pesquisaInput = document.getElementById('pesquisaUsuario');
    const tipoSelect = document.getElementById('filtroTipo');

    [pesquisaInput, tipoSelect].forEach(elemento => {
        if (elemento) {
            elemento.addEventListener('input', carregarUsuarios);
        }
    });

    // Configurar modal de usuário
    const modalUsuario = document.getElementById('modalUsuario');
    if (modalUsuario) {
        const modal = new bootstrap.Modal(modalUsuario);
        const salvarBtn = document.getElementById('salvarUsuario');
        
        salvarBtn.addEventListener('click', () => {
            const usuario = {
                nome: document.getElementById('usuarioNome').value,
                email: document.getElementById('usuarioEmail').value,
                senha: document.getElementById('usuarioSenha').value,
                tipo: document.getElementById('usuarioTipo').value
            };

            const usuarioId = document.getElementById('usuarioId').value;
            
            if (usuarioId) {
                window.dbFunctions.atualizarUsuario(parseInt(usuarioId), usuario);
            } else {
                window.dbFunctions.adicionarUsuario(usuario);
            }

            modal.hide();
            carregarUsuarios();
            limparFormularioUsuario();
        });
    }
}

function carregarUsuarios() {
    const pesquisa = document.getElementById('pesquisaUsuario')?.value.toLowerCase();
    const tipo = document.getElementById('filtroTipo')?.value;

    let usuarios = window.dbFunctions.listarUsuarios();
    
    if (pesquisa) {
        usuarios = usuarios.filter(u => 
            u.nome.toLowerCase().includes(pesquisa) ||
            u.email.toLowerCase().includes(pesquisa)
        );
    }

    if (tipo) {
        usuarios = usuarios.filter(u => u.tipo === tipo);
    }

    const tbody = document.getElementById('tabelaUsuarios');
    if (tbody) {
        tbody.innerHTML = '';
        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td><span class="badge bg-${usuario.tipo === 'admin' ? 'danger' : 'primary'}">${usuario.tipo === 'admin' ? 'Administrador' : 'Usuário'}</span></td>
                <td><span class="badge bg-success">Ativo</span></td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarUsuario(${usuario.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="removerUsuario(${usuario.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function limparFormularioUsuario() {
    document.getElementById('usuarioId').value = '';
    document.getElementById('usuarioNome').value = '';
    document.getElementById('usuarioEmail').value = '';
    document.getElementById('usuarioSenha').value = '';
    document.getElementById('usuarioTipo').value = 'usuario';
    document.getElementById('modalUsuarioTitulo').textContent = 'Novo Usuário';
}

function inicializarPaginaRelatorios() {
    console.log('Inicializando página de relatórios');
    gerarRelatorios();
}

function atualizarGraficoCategorias(dados) {
    const ctx = document.getElementById('graficoCategorias').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.graficoCategorias) {
        window.graficoCategorias.destroy();
    }

    window.graficoCategorias = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(dados),
            datasets: [{
                data: Object.values(dados),
                backgroundColor: [
                    '#2563eb',
                    '#7c3aed',
                    '#db2777',
                    '#ea580c',
                    '#65a30d'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function atualizarGraficoAtividades(dados) {
    const ctx = document.getElementById('graficoAtividades').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.graficoAtividades) {
        window.graficoAtividades.destroy();
    }

    window.graficoAtividades = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(dados),
            datasets: [{
                label: 'Quantidade',
                data: Object.values(dados),
                backgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function atualizarDetalhesProduto(produtoId) {
    const detalheProduto = document.getElementById('detalheProduto');
    const quantidadeTotal = document.getElementById('quantidadeTotal');
    const listaCodigosBarras = document.getElementById('listaCodigosBarras');
    
    if (produtoId) {
        const produto = window.dbFunctions.obterProduto(produtoId);
        if (produto) {
            detalheProduto.classList.remove('d-none');
            quantidadeTotal.textContent = produto.quantidade;
            
            // Atualizar lista de códigos de barras
            const codigosBarras = produto.codigosBarras;
            listaCodigosBarras.innerHTML = codigosBarras.length > 0 
                ? codigosBarras.map(codigo => `
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <code class="me-2">${codigo}</code>
                        <span class="badge bg-primary">Registrado</span>
                    </div>
                `).join('')
                : '<p class="text-muted mb-0">Nenhum código de barras registrado</p>';
        }
    } else {
        detalheProduto.classList.add('d-none');
    }
}

function carregarHistoricoEntradas(produtoId = null) {
    const historico = window.dbFunctions.listarHistoricoEntradas(produtoId);
    const tbody = document.getElementById('historicoEntradas');
    
    if (tbody) {
        tbody.innerHTML = '';
        historico.forEach(entrada => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${entrada.data}</td>
                <td>${entrada.quantidade}</td>
                <td>${entrada.codigoBarras ? `<code>${entrada.codigoBarras}</code>` : '-'}</td>
                <td>${entrada.observacao || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Configurar eventos de filtro
document.addEventListener('DOMContentLoaded', function() {
    const pesquisaInput = document.getElementById('pesquisaProduto');
    const categoriaInput = document.getElementById('filtroCategoria');
    const estoqueSelect = document.getElementById('filtroEstoque');

    if (pesquisaInput) {
        pesquisaInput.addEventListener('input', carregarProdutos);
    }
    if (categoriaInput) {
        categoriaInput.addEventListener('input', carregarProdutos);
    }
    if (estoqueSelect) {
        estoqueSelect.addEventListener('change', carregarProdutos);
    }
});

function abrirModalTransferencias() {
    if (!verificarPermissao('aceitar_transferencias')) {
        mostrarFeedback('Você não tem permissão para acessar transferências.', 'warning');
        return;
    }
    carregarTransferenciasPendentes();
    new bootstrap.Modal(document.getElementById('modalTransferencias')).show();
}

function carregarTransferenciasPendentes() {
    const transferencias = window.dbFunctions.listarTransferenciasPendentes();
    const tbody = document.getElementById('tabelaTransferenciasPendentes');
    tbody.innerHTML = '';

    transferencias.forEach(transferencia => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${transferencia.data}</td>
            <td>${transferencia.produto}</td>
            <td>${transferencia.quantidade}</td>
            <td>${transferencia.origem}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="aceitarTransferencia(${transferencia.id})">
                    <i class="bi bi-check-lg"></i> Aceitar
                </button>
                <button class="btn btn-sm btn-danger" onclick="recusarTransferencia(${transferencia.id})">
                    <i class="bi bi-x-lg"></i> Recusar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function carregarDashboard() {
    if (!verificarPermissao('visualizar_estoque')) {
        mostrarFeedback('Você não tem permissão para visualizar o estoque.', 'warning');
        return;
    }

    const produtos = window.dbFunctions.listarProdutos();
    
    // Atualizar métricas
    const totalEstoque = produtos.reduce((total, p) => total + p.quantidade, 0);
    const valorTotal = produtos.reduce((total, p) => total + (p.preco * p.quantidade), 0);
    const transferenciasPendentes = window.dbFunctions.contarTransferenciasPendentes();

    document.getElementById('totalEstoque').textContent = totalEstoque;
    document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toFixed(2)}`;
    document.getElementById('totalAlertas').textContent = transferenciasPendentes;
} 