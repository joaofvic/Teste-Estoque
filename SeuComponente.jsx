import { cadastrarUsuario, fazerLogin, fazerLogout } from './auth';
import { adicionarItem, buscarItens } from './firestore';

// Exemplo de uso:
const handleCadastro = async (e) => {
    e.preventDefault();
    try {
        const user = await cadastrarUsuario('email@exemplo.com', 'senha123');
        console.log('Usuário cadastrado:', user);
    } catch (error) {
        console.error('Erro no cadastro:', error.message);
    }
};

const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const user = await fazerLogin('email@exemplo.com', 'senha123');
        console.log('Usuário logado:', user);
    } catch (error) {
        console.error('Erro no login:', error.message);
    }
};

// Exemplo de adição de um produto
const adicionarProduto = async () => {
    try {
        const novoProduto = {
            nome: "Produto Teste",
            quantidade: 10,
            preco: 29.99
        };
        
        const id = await adicionarItem('produtos', novoProduto);
        console.log('Produto adicionado com ID:', id);
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
    }
};

// Exemplo de busca de produtos
const buscarProdutos = async () => {
    try {
        const produtos = await buscarItens('produtos');
        console.log('Produtos:', produtos);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
    }
}; 