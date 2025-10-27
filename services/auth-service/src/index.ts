// sistema-eventos/services/auth-service/src/index.ts
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

// --- Banco de Dados ---
interface User { // Definindo a interface para clareza
  id: number;
  email: string;
  password: string; // Hash da senha
  role: 'creator' | 'attendee'; // Papéis permitidos
}
const users: User[] = [];
// ---------------------------

const SECRET_KEY = 'sua-chave-secreta-para-jwt';

// --- Rota de Registro ---
app.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validação básica do papel
    if (!role || (role !== 'creator' && role !== 'attendee')) {
      return res.status(400).json({ message: 'Papel inválido. Escolha "creator" ou "attendee".' });
    }
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Este email já está cadastrado.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salva o novo usuário com o papel
    const newUser: User = {
      id: users.length + 1,
      email: email,
      password: hashedPassword,
      role: role,
    };
    users.push(newUser);

    console.log('Usuários cadastrados:', users);
    res.status(201).json({ message: 'Usuário registrado com sucesso!' });

  } catch (error) {
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

// --- Rota de Login ---
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Gera o Token JWT incluindo o papel (role)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Retorna o token E o papel para o front-end saber
    res.status(200).json({ token: token, role: user.role });

  } catch (error) {
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

app.listen(8001, () => {
  console.log('Auth-Service (Framework) ATUALIZADO COM ROLES rodando na porta 8001');
});