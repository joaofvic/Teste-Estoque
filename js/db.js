import { db, auth } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
    serverTimestamp 
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';

const dbFunctions = {
    // Autenticação
    async autenticar(email, senha) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;
            
            // Buscar dados adicionais do usuário no Firestore
            const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
            const userData = userDoc.data();
            
            return {
                id: user.uid,
                email: user.email,
                nome: userData.nome,
                tipo: userData.tipo,
                nivel_acesso: userData.nivel_acesso
            };
        } catch (error) {
            console.error('Erro na autenticação:', error);
            throw new Error('Credenciais inválidas');
        }
    },

    async fazerLogout() {
        await signOut(auth);
    },

    // Produtos
    async listarProdutos(filtros = {}) {
        try {
            let q = collection(db, 'produtos');
            
            if (filtros.categoria) {
                q = query(q, where('categoria', '==', filtros.categoria));
            }
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erro ao listar produtos:', error);
            throw error;
        }
    },

    async adicionarProduto(produto) {
        try {
            const docRef = await addDoc(collection(db, 'produtos'), {
                ...produto,
                data_cadastro: serverTimestamp(),
                ultima_atualizacao: serverTimestamp()
            });
            
            return {
                id: docRef.id,
                ...produto
            };
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            throw error;
        }
    },

    async atualizarProduto(id, produto) {
        try {
            const produtoRef = doc(db, 'produtos', id);
            await updateDoc(produtoRef, {
                ...produto,
                ultima_atualizacao: serverTimestamp()
            });
            
            return {
                id,
                ...produto
            };
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    },

    async removerProduto(id) {
        try {
            await deleteDoc(doc(db, 'produtos', id));
            return true;
        } catch (error) {
            console.error('Erro ao remover produto:', error);
            throw error;
        }
    },

    // Transferências
    async listarTransferencias(filtros = {}) {
        try {
            let q = collection(db, 'transferencias');
            
            if (filtros.status) {
                q = query(q, where('status', '==', filtros.status));
            }
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erro ao listar transferências:', error);
            throw error;
        }
    },

    async criarTransferencia(dados) {
        try {
            const docRef = await addDoc(collection(db, 'transferencias'), {
                ...dados,
                data: serverTimestamp(),
                status: 'pendente'
            });
            
            return {
                id: docRef.id,
                ...dados,
                status: 'pendente'
            };
        } catch (error) {
            console.error('Erro ao criar transferência:', error);
            throw error;
        }
    },

    async atualizarStatusTransferencia(id, novoStatus) {
        try {
            const transferenciaRef = doc(db, 'transferencias', id);
            await updateDoc(transferenciaRef, {
                status: novoStatus,
                data_atualizacao: serverTimestamp()
            });
            
            // Se a transferência for aceita, atualizar estoque
            if (novoStatus === 'aceita') {
                const transferenciaDoc = await getDoc(transferenciaRef);
                const transferencia = transferenciaDoc.data();
                
                for (const item of transferencia.produtos) {
                    const produtoRef = doc(db, 'produtos', item.produto.id);
                    const produtoDoc = await getDoc(produtoRef);
                    const produto = produtoDoc.data();
                    
                    await updateDoc(produtoRef, {
                        quantidade: produto.quantidade - item.quantidade
                    });
                }
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao atualizar status da transferência:', error);
            throw error;
        }
    },

    // Usuários
    async listarUsuarios() {
        try {
            const querySnapshot = await getDocs(collection(db, 'usuarios'));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            throw error;
        }
    },

    async adicionarUsuario(usuario) {
        try {
            // Criar usuário no Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                usuario.email,
                usuario.senha
            );
            
            // Adicionar dados adicionais no Firestore
            await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
                nome: usuario.nome,
                tipo: usuario.tipo,
                nivel_acesso: usuario.nivel_acesso,
                email: usuario.email
            });
            
            return {
                id: userCredential.user.uid,
                email: usuario.email,
                nome: usuario.nome,
                tipo: usuario.tipo,
                nivel_acesso: usuario.nivel_acesso
            };
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            throw error;
        }
    },

    async atualizarUsuario(id, dados) {
        try {
            const usuarioRef = doc(db, 'usuarios', id);
            await updateDoc(usuarioRef, dados);
            
            return {
                id,
                ...dados
            };
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    }
};

// Exportar para uso global
window.dbFunctions = dbFunctions; 