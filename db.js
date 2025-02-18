console.log('Carregando banco de dados...');

// Dados iniciais para novos usuários
const dadosIniciais = {
    usuarios: [
        { 
            id: 1, 
            email: 'admin@exemplo.com', 
            senha: 'admin123', 
            tipo: 'admin', 
            nome: 'Administrador',
            nivel_acesso: {
                gestao_usuarios: true,
                excluir_dados: true,
                configuracoes: true,
                relatorios: true,
                transferencias: true,
                gestao_estoque: true
            },
            tentativas_login: 0,
            bloqueado_ate: null
        },
        {
            id: 2,
            email: 'usuario@exemplo.com',
            senha: 'usuario123',
            tipo: 'usuario',
            nome: 'Usuário Padrão',
            nivel_acesso: {
                gestao_usuarios: false,
                excluir_dados: false,
                configuracoes: false,
                relatorios: false,
                transferencias: true,
                gestao_estoque: false
            },
            tentativas_login: 0,
            bloqueado_ate: null
        }
    ],
    produtos: [],
    transferencias: [],
    historico_entradas: [],
    atividades: [],
    logs_autenticacao: []
};

// Função para resetar o banco de dados
function resetarBancoDados() {
    localStorage.setItem('dbEstoque', JSON.stringify(dadosIniciais));
    return dadosIniciais;
}

// Inicializar banco de dados se não existir
if (!localStorage.getItem('dbEstoque')) {
    resetarBancoDados();
}

// Tentar carregar dados do localStorage
let db;
try {
    const dadosSalvos = localStorage.getItem('dbEstoque');
    if (dadosSalvos) {
        db = JSON.parse(dadosSalvos);
        console.log('Dados carregados do localStorage');
    } else {
        db = dadosIniciais;
        localStorage.setItem('dbEstoque', JSON.stringify(db));
        console.log('Dados iniciais carregados');
    }
} catch (error) {
    console.error('Erro ao carregar dados:', error);
    db = dadosIniciais;
    localStorage.setItem('dbEstoque', JSON.stringify(db));
}

// Função para salvar dados no localStorage
function salvarDados() {
    try {
        localStorage.setItem('dbEstoque', JSON.stringify(db));
        console.log('Dados salvos com sucesso');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

console.log('Estado atual do banco de dados:', db);

// Funções de autenticação
function autenticar(email, senha) {
    console.log('Tentando autenticar:', email);
    const usuario = db.usuarios.find(u => u.email === email);
    
    if (!usuario) {
        registrarTentativaLogin(email, false, 'Usuário não encontrado');
        return null;
    }

    // Verificar se o usuário está bloqueado
    if (usuario.bloqueado_ate && new Date() < new Date(usuario.bloqueado_ate)) {
        registrarTentativaLogin(email, false, 'Usuário bloqueado');
        return { erro: 'Usuário bloqueado temporariamente. Tente novamente mais tarde.' };
    }

    // Verificar senha
    if (usuario.senha === senha) {
        // Reset tentativas de login em caso de sucesso
        usuario.tentativas_login = 0;
        usuario.ultimo_login = new Date().toISOString();
        registrarTentativaLogin(email, true, 'Login bem-sucedido');
        
        const { senha: _, bloqueado_ate: __, tentativas_login: ___, ...usuarioSemDadosSensiveis } = usuario;
        return usuarioSemDadosSensiveis;
    }

    // Incrementar tentativas de login
    usuario.tentativas_login++;
    
    // Bloquear após 3 tentativas
    if (usuario.tentativas_login >= 3) {
        const bloqueioAte = new Date();
        bloqueioAte.setMinutes(bloqueioAte.getMinutes() + 30); // Bloquear por 30 minutos
        usuario.bloqueado_ate = bloqueioAte.toISOString();
        registrarTentativaLogin(email, false, 'Usuário bloqueado após múltiplas tentativas');
        return { erro: 'Usuário bloqueado por 30 minutos devido a múltiplas tentativas de login.' };
    }

    registrarTentativaLogin(email, false, 'Senha incorreta');
    return null;
}

function registrarTentativaLogin(email, sucesso, mensagem) {
    const log = {
        id: db.logs_autenticacao.length + 1,
        email,
        data: new Date().toISOString(),
        sucesso,
        mensagem,
        ip: '127.0.0.1', // Em um ambiente real, isso viria do request
        user_agent: 'Browser' // Em um ambiente real, isso viria do request
    };
    
    db.logs_autenticacao.push(log);
    return log;
}

// Funções de produtos
function listarProdutos(filtros = {}) {
    let produtos = [...db.produtos];
    
    if (filtros.categoria) {
        produtos = produtos.filter(p => 
            p.categoria.toLowerCase().includes(filtros.categoria)
        );
    }
    
    if (filtros.busca) {
        produtos = produtos.filter(p => 
            p.nome.toLowerCase().includes(filtros.busca) ||
            p.categoria.toLowerCase().includes(filtros.busca)
        );
    }
    
    if (filtros.estoque) {
        switch (filtros.estoque) {
            case 'baixo':
                produtos = produtos.filter(p => p.quantidade < 50);
                break;
            case 'normal':
                produtos = produtos.filter(p => p.quantidade >= 50 && p.quantidade < 100);
                break;
            case 'alto':
                produtos = produtos.filter(p => p.quantidade >= 100);
                break;
        }
    }
    
    return produtos;
}

function adicionarProduto(produto) {
    const novoId = db.produtos.length > 0 ? Math.max(...db.produtos.map(p => p.id)) + 1 : 1;
    const novoProduto = {
        ...produto,
        id: novoId,
        codigosBarras: [],
        historico_precos: [{
            data: new Date().toISOString(),
            preco: produto.preco,
            usuario: 1
        }],
        status: 'ativo',
        data_cadastro: new Date().toISOString(),
        ultima_atualizacao: new Date().toISOString(),
        usuario_cadastro: 1,
        usuario_ultima_atualizacao: 1
    };
    
    db.produtos.push(novoProduto);
    salvarDados(); // Salvar após adicionar produto
    registrarAtividade(1, `Adicionou produto: ${produto.nome}`, 'Concluído');
    return novoProduto;
}

function atualizarProduto(id, produtoAtualizado) {
    const index = db.produtos.findIndex(p => p.id === id);
    if (index === -1) {
        throw new Error('Produto não encontrado');
    }
    
    // Manter o ID original
    produtoAtualizado.id = id;
    
    // Atualizar o produto
    db.produtos[index] = produtoAtualizado;
    
    // Registrar atividade
    registrarAtividade(1, `Atualizou produto: ${produtoAtualizado.nome}`, 'Concluído');
    
    // Salvar alterações
    salvarDados();
}

function removerProduto(id) {
    const index = db.produtos.findIndex(p => p.id === id);
    if (index !== -1) {
        const produto = db.produtos[index];
        
        // Remover o produto
        db.produtos.splice(index, 1);
        
        // Remover o histórico de entradas do produto
        db.historicoEntradas = db.historicoEntradas.filter(entrada => entrada.produtoId !== id);
        
        salvarDados(); // Salvar após remover produto e seu histórico
        registrarAtividade(1, `Removeu produto: ${produto.nome}`, 'Concluído');
        return true;
    }
    return false;
}

function obterProduto(id) {
    return db.produtos.find(p => p.id === id);
}

// Funções de usuários
function listarUsuarios() {
    return db.usuarios.map(({ senha, ...usuario }) => usuario);
}

function adicionarUsuario(usuario) {
    const novoId = Math.max(...db.usuarios.map(u => u.id)) + 1;
    const novoUsuario = { ...usuario, id: novoId };
    db.usuarios.push(novoUsuario);
    registrarAtividade(1, `Adicionou usuário: ${usuario.nome}`, 'Concluído');
    return { ...novoUsuario, senha: undefined };
}

function atualizarUsuario(id, dados) {
    const index = db.usuarios.findIndex(u => u.id === id);
    if (index !== -1) {
        db.usuarios[index] = { ...db.usuarios[index], ...dados };
        registrarAtividade(1, `Atualizou usuário: ${dados.nome}`, 'Concluído');
        const { senha, ...usuarioAtualizado } = db.usuarios[index];
        return usuarioAtualizado;
    }
    return null;
}

function removerUsuario(id) {
    const index = db.usuarios.findIndex(u => u.id === id);
    if (index !== -1) {
        const usuario = db.usuarios[index];
        db.usuarios.splice(index, 1);
        registrarAtividade(1, `Removeu usuário: ${usuario.nome}`, 'Concluído');
        return true;
    }
    return false;
}

// Funções de atividades
function listarAtividades(filtros = {}) {
    let atividades = db.atividades.map(atividade => {
        const usuario = db.usuarios.find(u => u.id === atividade.usuarioId);
        return {
            ...atividade,
            usuario: usuario ? usuario.nome : 'Usuário Desconhecido'
        };
    });

    if (filtros.dataInicio) {
        atividades = atividades.filter(a => new Date(a.data) >= new Date(filtros.dataInicio));
    }

    if (filtros.dataFim) {
        atividades = atividades.filter(a => new Date(a.data) <= new Date(filtros.dataFim));
    }

    if (filtros.status) {
        atividades = atividades.filter(a => a.status === filtros.status);
    }

    return atividades;
}

function registrarAtividade(usuarioId, acao, status) {
    const novoId = Math.max(...db.atividades.map(a => a.id)) + 1;
    const novaAtividade = {
        id: novoId,
        usuarioId,
        acao,
        data: new Date().toLocaleString(),
        status
    };
    db.atividades.push(novaAtividade);
    
    // Salvar dados no localStorage
    salvarDados();
    
    return novaAtividade;
}

// Funções de relatórios
function gerarRelatorioEstoque() {
    const produtos = db.produtos;
    const totalProdutos = produtos.length;
    const valorTotalEstoque = produtos.reduce((total, p) => total + (p.preco * p.quantidade), 0);
    const produtosBaixoEstoque = produtos.filter(p => p.quantidade < 50).length;
    
    return {
        totalProdutos,
        valorTotalEstoque,
        produtosBaixoEstoque,
        produtosPorCategoria: produtos.reduce((acc, p) => {
            acc[p.categoria] = (acc[p.categoria] || 0) + 1;
            return acc;
        }, {})
    };
}

function gerarRelatorioAtividades(periodo) {
    const atividades = db.atividades;
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodo);
    
    const atividadesFiltradas = atividades.filter(a => new Date(a.data) >= dataInicio);
    
    return {
        total: atividadesFiltradas.length,
        porStatus: atividadesFiltradas.reduce((acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
        }, {}),
        porUsuario: atividadesFiltradas.reduce((acc, a) => {
            const usuario = db.usuarios.find(u => u.id === a.usuarioId);
            const nome = usuario ? usuario.nome : 'Usuário Desconhecido';
            acc[nome] = (acc[nome] || 0) + 1;
            return acc;
        }, {})
    };
}

function obterProdutoPorCodigoBarras(codigo) {
    console.log('Procurando produto com código:', codigo);
    console.log('Produtos disponíveis:', db.produtos);
    
    // Verificar se o código está no histórico de entradas
    const entradaComSerie = db.historicoEntradas.find(entrada => 
        entrada.numeroSerie && entrada.numeroSerie === codigo
    );
    
    if (entradaComSerie) {
        return db.produtos.find(p => p.id === entradaComSerie.produtoId);
    }
    
    // Se não encontrou no histórico, procurar nos códigos de barras dos produtos
    return db.produtos.find(produto => 
        produto.codigosBarras && produto.codigosBarras.includes(codigo)
    );
}

function obterDetalhesCodigoBarras(produtoId, codigoBarras) {
    const produto = db.produtos.find(p => p.id === produtoId);
    if (produto) {
        return produto.codigosBarras.includes(codigoBarras);
    }
    return null;
}

function listarCodigosBarrasProduto(produtoId) {
    const produto = obterProduto(produtoId);
    if (!produto) return [];
    return produto.codigosBarras;
}

function verificarNumeroSerie(numeroSerie) {
    if (!numeroSerie) return false;
    return db.historicoEntradas.some(entrada => entrada.numeroSerie === numeroSerie);
}

function registrarEntradaEstoque(produtoId, quantidade, observacao, usuarioId, numeroSerie, estado) {
    const produto = db.produtos.find(p => p.id === produtoId);
    if (!produto) {
        throw new Error('Produto não encontrado');
    }

    if (quantidade <= 0) {
        throw new Error('A quantidade deve ser maior que zero');
    }

    // Verificar se o número de série já existe
    if (numeroSerie && verificarNumeroSerie(numeroSerie)) {
        throw new Error('Este número de série já foi registrado anteriormente');
    }

    // Criar entrada no histórico
    const entrada = {
        id: db.historicoEntradas.length + 1,
        produtoId: produtoId,
        quantidade: quantidade,
        data: new Date().toLocaleString(),
        observacao: observacao || '',
        usuarioId: usuarioId,
        numeroSerie: numeroSerie || null,
        estado: estado || 'NOVO' // Adicionar estado do produto
    };

    // Adicionar ao histórico
    db.historicoEntradas.push(entrada);

    // Atualizar quantidade e estado do produto
    produto.quantidade = (produto.quantidade || 0) + quantidade;
    if (estado) {
        produto.estado = estado;
    }

    // Se houver número de série, adicionar aos códigos de barras do produto
    if (numeroSerie && !produto.codigosBarras.includes(numeroSerie)) {
        produto.codigosBarras.push(numeroSerie);
    }

    // Registrar atividade
    registrarAtividade(
        usuarioId, 
        `Entrada de ${quantidade} unidade(s) do produto ${produto.nome} em estado ${estado || 'NOVO'}${numeroSerie ? ` com número de série ${numeroSerie}` : ''}`, 
        'Concluído'
    );

    // Salvar dados no localStorage
    salvarDados();

    return entrada;
}

function listarHistoricoEntradas(produtoId) {
    let historico = db.historicoEntradas;
    
    if (produtoId) {
        historico = historico.filter(h => h.produtoId === produtoId);
    }
    
    return historico.map(entrada => {
        const produto = db.produtos.find(p => p.id === entrada.produtoId);
        const usuario = db.usuarios.find(u => u.id === entrada.usuarioId);
        return {
            ...entrada,
            produto: produto ? produto.nome : 'Produto Removido',
            usuario: usuario ? usuario.nome : 'Usuário Desconhecido',
            numeroSerie: entrada.numeroSerie
        };
    }).sort((a, b) => new Date(b.data) - new Date(a.data));
}

// Função para atualizar preço
function atualizarPrecoProduto(produtoId, novoPreco, usuarioId) {
    const produto = obterProduto(produtoId);
    if (!produto) throw new Error('Produto não encontrado');

    produto.preco = novoPreco;
    produto.ultima_atualizacao = new Date().toISOString();
    produto.usuario_ultima_atualizacao = usuarioId;

    produto.historico_precos.push({
        data: new Date().toISOString(),
        preco: novoPreco,
        usuario: usuarioId
    });

    registrarAtividade(usuarioId, `Atualizou preço do produto ${produto.nome} para R$ ${novoPreco}`, 'Concluído');
    return produto;
}

// Funções para gerenciar transferências
function criarTransferencia(dados) {
    console.log('Criando transferência com dados:', dados);
    
    // Validar se há quantidade suficiente dos produtos no estoque
    for (const produto of dados.produtos) {
        const produtoEstoque = obterProduto(produto.id);
        if (!produtoEstoque || produtoEstoque.quantidade < produto.quantidade) {
            throw new Error(`Quantidade insuficiente do produto ${produto.nome} no estoque`);
        }

        // Verificar se o número de série pertence ao produto
        if (produto.numeroSerie) {
            const produtoSerie = verificarNumeroSerieProduto(produto.numeroSerie);
            if (!produtoSerie || produtoSerie.id !== produto.id) {
                throw new Error(`Número de série ${produto.numeroSerie} não pertence ao produto ${produto.nome}`);
            }
        }
    }

    // Inicializar array de transferências se não existir
    if (!db.transferencias) {
        db.transferencias = [];
    }

    const novaTransferencia = {
        id: db.transferencias.length + 1,
        data: new Date().toLocaleString(),
        destino: dados.destino,
        produtos: dados.produtos.map(p => {
            const produtoEstoque = obterProduto(p.id);
            return {
                ...p,
                numeroSerie: p.numeroSerie || null,
                estado: p.estado || produtoEstoque.estado || 'NOVO'
            };
        }),
        status: 'pendente',
        observacoes: dados.observacoes || '',
        usuario: dados.usuario,
        origem: {
            tipo: 'estoque',
            nome: 'Estoque Principal'
        }
    };

    console.log('Nova transferência criada:', novaTransferencia);
    db.transferencias.push(novaTransferencia);
    salvarDados();

    // Registrar a atividade
    registrarAtividade(
        dados.usuario,
        `Nova transferência criada para ${dados.destino.nome}: ${dados.produtos.map(p => 
            `${p.nome} (${p.quantidade})${p.numeroSerie ? ` - Série: ${p.numeroSerie}` : ''} - Estado: ${p.estado || 'NOVO'}`
        ).join(', ')}`,
        'Pendente'
    );

    return novaTransferencia;
}

function listarTransferencias(filtros = {}) {
    if (!db.transferencias) {
        db.transferencias = [];
        salvarDados();
    }
    
    return db.transferencias.filter(transferencia => {
        if (filtros.status && transferencia.status !== filtros.status) return false;
        if (filtros.usuarioDestino && transferencia.destino.id !== filtros.usuarioDestino) return false;
        if (filtros.usuarioOrigem && transferencia.usuario !== filtros.usuarioOrigem) return false;
        return true;
    });
}

function atualizarStatusTransferencia(id, novoStatus, usuarioId) {
    console.log('Atualizando status da transferência:', { id, novoStatus, usuarioId });
    
    if (!db.transferencias) {
        db.transferencias = [];
    }
    
    const index = db.transferencias.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transferência não encontrada');
    
    const transferencia = db.transferencias[index];
    console.log('Transferência encontrada:', transferencia);
    
    // Verificar se o usuário é o destinatário da transferência
    if (transferencia.destino.id !== usuarioId && novoStatus === 'aceita') {
        throw new Error('Apenas o destinatário pode aceitar a transferência');
    }
    
    db.transferencias[index].status = novoStatus;
    
    // Se a transferência for aceita, atualizar os estoques
    if (novoStatus === 'aceita') {
        console.log('Atualizando transferência para aceita...');
        
        // Reduzir estoque dos produtos do estoque principal
        for (const produto of transferencia.produtos) {
            const produtoEstoque = obterProduto(produto.id);
            if (produtoEstoque) {
                console.log(`Atualizando estoque do produto ${produto.nome}. Quantidade atual: ${produtoEstoque.quantidade}, Redução: ${produto.quantidade}`);
                produtoEstoque.quantidade -= produto.quantidade;
                atualizarProduto(produto.id, produtoEstoque);
            }
        }
        
        // Adicionar ao estoque do usuário
        console.log(`Atualizando estoque do usuário ${usuarioId}...`);
        
        // Inicializar o estoque do usuário no db principal se não existir
        if (!db.estoquesUsuarios) {
            console.log('Inicializando estrutura de estoques de usuários');
            db.estoquesUsuarios = {};
        }
        if (!db.estoquesUsuarios[usuarioId]) {
            console.log('Inicializando estoque do usuário:', usuarioId);
            db.estoquesUsuarios[usuarioId] = [];
        }
        
        for (const produto of transferencia.produtos) {
            const produtoCompleto = obterProduto(produto.id);
            if (!produtoCompleto) {
                console.error('Produto não encontrado:', produto.id);
                continue;
            }
            
            const produtoExistente = db.estoquesUsuarios[usuarioId].find(p => p.id === produto.id);
            
            if (produtoExistente) {
                console.log(`Produto ${produto.nome} já existe no estoque do usuário. Quantidade atual: ${produtoExistente.quantidade}, Adição: ${produto.quantidade}`);
                produtoExistente.quantidade += produto.quantidade;
                if (produto.numeroSerie) {
                    produtoExistente.numerosSerie = produtoExistente.numerosSerie || [];
                    produtoExistente.numerosSerie.push(produto.numeroSerie);
                }
            } else {
                console.log(`Adicionando novo produto ${produto.nome} ao estoque do usuário`);
                db.estoquesUsuarios[usuarioId].push({
                    ...produtoCompleto,
                    quantidade: produto.quantidade,
                    numerosSerie: produto.numeroSerie ? [produto.numeroSerie] : [],
                    categoria: produtoCompleto.categoria,
                    estado: produto.estado || produtoCompleto.estado || 'NOVO'
                });
            }
        }
        
        console.log('Estoque do usuário após atualização:', db.estoquesUsuarios[usuarioId]);
        
        // Salvar alterações no banco de dados principal
        salvarDados();
        
        // Registrar a atividade
        registrarAtividade(
            usuarioId,
            `Transferência aceita: ${transferencia.produtos.map(p => 
                `${p.nome} (${p.quantidade})${p.numeroSerie ? ` - Série: ${p.numeroSerie}` : ''}`
            ).join(', ')}`,
            'Concluído'
        );
    } else if (novoStatus === 'recusada') {
        // Registrar a atividade de recusa
        registrarAtividade(
            usuarioId,
            `Transferência recusada: ${transferencia.produtos.map(p => 
                `${p.nome} (${p.quantidade})${p.numeroSerie ? ` - Série: ${p.numeroSerie}` : ''}`
            ).join(', ')}`,
            'Recusado'
        );
    }
    
    salvarDados();
    return db.transferencias[index];
}

function contarTransferenciasPendentes(usuarioId) {
    if (!db.transferencias) {
        db.transferencias = [];
        salvarDados();
    }
    return db.transferencias.filter(t => t.destino.id === usuarioId && t.status === 'pendente').length;
}

function listarEstoqueUsuario(usuarioId) {
    console.log('Listando estoque do usuário:', usuarioId);
    console.log('Estado atual do db:', db);
    
    // Garantir que a estrutura existe
    if (!db.estoquesUsuarios) {
        console.log('Inicializando estrutura de estoques de usuários');
        db.estoquesUsuarios = {};
        salvarDados();
    }
    
    // Garantir que o estoque do usuário existe
    if (!db.estoquesUsuarios[usuarioId]) {
        console.log('Inicializando estoque do usuário:', usuarioId);
        db.estoquesUsuarios[usuarioId] = [];
        salvarDados();
    }
    
    console.log('Estoque do usuário encontrado:', db.estoquesUsuarios[usuarioId]);
    return db.estoquesUsuarios[usuarioId];
}

function obterProdutoPorLocalizacao(produtoId, localizacao) {
    const produto = obterProduto(produtoId);
    if (!produto) return null;
    
    // Verificar se o produto está na localização especificada
    if (produto.localizacao.prateleira === localizacao.prateleira &&
        produto.localizacao.corredor === localizacao.corredor &&
        produto.localizacao.posicao === localizacao.posicao) {
        return produto;
    }
    
    return null;
}

function listarLocalizacoes() {
    const produtos = listarProdutos();
    const localizacoes = new Set();
    
    produtos.forEach(produto => {
        const loc = `${produto.localizacao.prateleira}/${produto.localizacao.corredor}/${produto.localizacao.posicao}`;
        localizacoes.add(loc);
    });
    
    return Array.from(localizacoes).map(loc => {
        const [prateleira, corredor, posicao] = loc.split('/');
        return { prateleira, corredor, posicao };
    });
}

// Adicionar função para verificar se um produto tem um número de série específico
function verificarNumeroSerieProduto(numeroSerie) {
    console.log('Verificando número de série:', numeroSerie);
    
    // Verificar no histórico de entradas
    const entradaComSerie = db.historicoEntradas.find(entrada => 
        entrada.numeroSerie === numeroSerie
    );
    
    if (entradaComSerie) {
        const produto = db.produtos.find(p => p.id === entradaComSerie.produtoId);
        console.log('Produto encontrado no histórico:', produto);
        return produto;
    }
    
    // Verificar nos códigos de barras dos produtos
    const produtoComSerie = db.produtos.find(produto => 
        produto.codigosBarras && produto.codigosBarras.includes(numeroSerie)
    );
    
    console.log('Produto encontrado nos códigos de barras:', produtoComSerie);
    return produtoComSerie;
}

// Exportar funções
const dbFunctions = {
    autenticar,
    listarProdutos,
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    obterProduto,
    obterProdutoPorCodigoBarras,
    obterDetalhesCodigoBarras,
    listarCodigosBarrasProduto,
    listarUsuarios,
    adicionarUsuario,
    atualizarUsuario,
    removerUsuario,
    listarAtividades,
    registrarAtividade,
    gerarRelatorioEstoque,
    gerarRelatorioAtividades,
    registrarEntradaEstoque,
    listarHistoricoEntradas,
    atualizarPrecoProduto,
    verificarNumeroSerie,
    criarTransferencia,
    listarTransferencias,
    atualizarStatusTransferencia,
    listarLocalizacoes,
    verificarNumeroSerieProduto,
    listarEstoqueUsuario,
    contarTransferenciasPendentes
};

// Garantir que as funções estejam disponíveis globalmente
window.dbFunctions = dbFunctions;
console.log('Funções do banco de dados exportadas:', Object.keys(dbFunctions)); 