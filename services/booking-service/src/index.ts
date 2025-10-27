// services/booking-service/src/index.ts
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'sua-chave-secreta-para-jwt';
const PAYMENT_SERVICE_URL = 'http://payment-service:8004';
const EVENT_SERVICE_URL = 'http://event-service:8002'; 

interface Booking { 
  id: number;
  userId: number;
  eventId: number;
  userEmail: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'failed';
  transactionId?: string;
}
// Interface para os dados do evento
interface EventDetails {
    id: number;
    nome: string;
    isPaid: boolean;
    price: number;
}

let bookings: Booking[] = [];

const checkAuth = (req: any, res: any, next: any) => { 
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, SECRET_KEY);
        req.userData = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Autenticação falhou' });
    }
};

// --- Rota: Inscrever-se em um evento ---
app.post('/:eventId', checkAuth, async (req: any, res) => {
  const eventId = parseInt(req.params.eventId);
  const userId = req.userData.id;
  const userEmail = req.userData.email;

  const existingConfirmedBooking = bookings.find( 
    b => b.userId === userId && b.eventId === eventId && b.status === 'confirmed'
  );
  if (existingConfirmedBooking) {
    return res.status(400).json({ message: 'Você já está inscrito e confirmado neste evento.' });
  }

  // --- Buscar detalhes do evento ---
  let eventDetails: EventDetails;
  try {
      console.log(`Booking Service: Buscando detalhes do evento ${eventId} em ${EVENT_SERVICE_URL}/${eventId}`);
      const eventResponse = await axios.get<EventDetails>(`${EVENT_SERVICE_URL}/${eventId}`);
      eventDetails = eventResponse.data;
      console.log('Booking Service: Detalhes recebidos:', eventDetails);
  } catch (error: any) {
      console.error('Booking Service: Erro ao buscar detalhes do evento:', error.message);
      if (error.response?.status === 404) {
          return res.status(404).json({ message: 'Evento não encontrado.' });
      }
      return res.status(500).json({ message: 'Erro ao verificar detalhes do evento.' });
  }
  // --- Fim da busca de detalhes ---

  // Cria a inscrição (sempre começa pendente, mesmo se gratuito, para simplificar o fluxo)
  const newBooking: Booking = {
    id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1,
    userId: userId,
    eventId: eventId,
    userEmail: userEmail,
    date: new Date(),
    status: 'pending'
  };
  bookings.push(newBooking);
  const bookingIndex = bookings.length - 1; // Índice da nova inscrição
  console.log('Booking Service: Inscrição criada como pendente:', newBooking);


  // --- DECISÃO: Precisa de pagamento? ---
  if (!eventDetails.isPaid) {
      // Evento Gratuito: Confirma imediatamente
      bookings[bookingIndex].status = 'confirmed';
      console.log('Booking Service: Evento gratuito. Status atualizado para confirmado:', bookings[bookingIndex]);
      return res.status(201).json(bookings[bookingIndex]);
  } else {
      // Evento Pago: Tenta processar o pagamento
      try {
        const amount = eventDetails.price; // Usa o preço do evento
        console.log(`Booking Service: Enviando requisição de pagamento (R$${amount / 100}) para ${PAYMENT_SERVICE_URL}/process-payment`);
        const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/process-payment`, {
          bookingId: newBooking.id,
          amount: amount // Envia o valor correto
        });

        if (paymentResponse.data.success) {
          bookings[bookingIndex].status = 'confirmed';
          bookings[bookingIndex].transactionId = paymentResponse.data.transactionId;
          console.log('Booking Service: Pagamento aprovado. Status atualizado para confirmado:', bookings[bookingIndex]);
          return res.status(201).json(bookings[bookingIndex]);
        } else {
             bookings[bookingIndex].status = 'failed';
             console.log('Booking Service: Pagamento recusado. Status da inscrição:', bookings[bookingIndex]);
             return res.status(402).json({
                 message: 'Inscrição pendente: Falha no pagamento.',
                 booking: bookings[bookingIndex]
             });
        }
      } catch (paymentError: any) {
        console.error('Booking Service: Erro ao chamar o serviço de pagamento:', paymentError.message);
         // Mantém status pending
        return res.status(500).json({
          message: 'Não foi possível processar o pagamento no momento. Sua inscrição está pendente.',
          booking: bookings[bookingIndex]
        });
      }
  }
  // --- Fim da decisão ---
});

// Rota: Listar minhas inscrições
app.get('/my-bookings', checkAuth, (req: any, res) => {
  const userId = req.userData.id;
  const myBookings = bookings.filter(b => b.userId === userId);
  res.status(200).json(myBookings);
});

app.listen(8003, () => {
  console.log('Booking-Service (SPL) ATUALIZADO COM VERIFICAÇÃO DE PREÇO rodando na porta 8003');
});