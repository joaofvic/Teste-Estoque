import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut 
} from "firebase/auth";
import { auth } from "./firebase-config";

// Função para criar novo usuário
export const cadastrarUsuario = async (email, senha) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

// Função para fazer login
export const fazerLogin = async (email, senha) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

// Função para fazer logout
export const fazerLogout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        throw error;
    }
}; 