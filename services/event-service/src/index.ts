// services/event-service/src/index.ts
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'sua-chave-secreta-para-jwt';

// --- Interface e "Banco de Dados" Fake ---
interface Event {
    id: number;
    nome: string;
    local: string;
    ownerId: number;
    isPaid: boolean; // <<< NOVO CAMPO
    price: number;   // <<< NOVO CAMPO (Preço em centavos ou formato numérico)
}

let events: Event[] = [
    { id: 1, nome: "Palestra de Reuso de Software", local: "UFAL", ownerId: 0, isPaid: false, price: 0 },
    { id: 2, nome: "Workshop de Microsserviços", local: "Instituto de Computação", ownerId: 0, isPaid: true, price: 2500 } // Ex: R$ 25,00
];
// --- Fim DB Fake ---

const checkAuth = (req: any, res: any, next: any) => { /* ... (código igual) ... */
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, SECRET_KEY);
        req.userData = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Autenticação falhou' });
    }
};

// Rota: Listar eventos (PÚBLICA) - Retorna novos campos
app.get('/', (req, res) => {
    res.status(200).json(events);
});

// Rota: Obter detalhes de UM evento (útil para o booking-service)
app.get('/:id', (req, res) => {
    const eventId = parseInt(req.params.id);
    const event = events.find(e => e.id === eventId);
    if (event) {
        res.status(200).json(event);
    } else {
        res.status(404).json({ message: 'Evento não encontrado' });
    }
});


// Rota: Criar um evento (PROTEGIDA, recebe novos campos)
app.post('/', checkAuth, (req: any, res) => {
    if (req.userData.role !== 'creator') {
        return res.status(403).json({ message: 'Apenas criadores podem adicionar eventos.' });
    }

    // Recebe os novos campos do corpo da requisição
    const { nome, local, isPaid, price } = req.body;

    // Validação simples
    if (typeof nome !== 'string' || typeof local !== 'string' || typeof isPaid !== 'boolean') {
         return res.status(400).json({ message: 'Dados inválidos (nome, local, isPaid obrigatórios).' });
    }
    if (isPaid && (typeof price !== 'number' || price <= 0)) {
        return res.status(400).json({ message: 'Eventos pagos devem ter um preço válido (número maior que zero).' });
    }

    const newEvent: Event = {
        id: events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1,
        nome,
        local,
        ownerId: req.userData.id,
        isPaid: isPaid,
        price: isPaid ? price : 0 // Garante que preço seja 0 se não for pago
    };
    events.push(newEvent);
    console.log('Eventos:', events);
    res.status(201).json(newEvent);
});

// Rota: Deletar um evento (PROTEGIDA) - Sem mudanças na lógica principal
app.delete('/:id', checkAuth, (req: any, res) => {
    const eventId = parseInt(req.params.id);
    const userId = req.userData.id;
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
        return res.status(404).json({ message: 'Evento não encontrado.' });
    }
    if (events[eventIndex].ownerId !== userId && events[eventIndex].ownerId !== 0 && req.userData.role !== 'creator') { // Admins/Creators podem deletar
        return res.status(403).json({ message: 'Você não tem permissão para deletar este evento.' });
    }

    events = events.filter(e => e.id !== eventId);
    console.log('Eventos:', events);
    res.status(200).json({ message: 'Evento deletado.' });
});

app.listen(8002, () => {
    console.log('Event-Service (SPL) ATUALIZADO COM isPaid/price rodando na porta 8002');
});