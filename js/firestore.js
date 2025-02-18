import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase-config';

// Adicionar um documento
export const adicionarItem = async (colecao, dados) => {
    try {
        const docRef = await addDoc(collection(db, colecao), dados);
        return docRef.id;
    } catch (error) {
        throw error;
    }
};

// Buscar todos os documentos de uma coleção
export const buscarItens = async (colecao) => {
    try {
        const querySnapshot = await getDocs(collection(db, colecao));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
};

// Atualizar um documento
export const atualizarItem = async (colecao, id, dados) => {
    try {
        const docRef = doc(db, colecao, id);
        await updateDoc(docRef, dados);
    } catch (error) {
        throw error;
    }
};

// Deletar um documento
export const deletarItem = async (colecao, id) => {
    try {
        const docRef = doc(db, colecao, id);
        await deleteDoc(docRef);
    } catch (error) {
        throw error;
    }
}; 