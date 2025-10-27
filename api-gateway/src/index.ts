// api-gateway/src/index.ts
import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';

const app = express();
app.use(cors());
app.use(express.json());

// Rota do Framework
app.use('/auth', proxy('http://auth-service:8001'));

// Rotas da SPL
app.use('/events', proxy('http://event-service:8002'));
app.use('/bookings', proxy('http://booking-service:8003'));

app.listen(8000, () => {
  console.log('API Gateway (Framework) ATUALIZADO rodando na porta 8000');
});

app.use('/payments', proxy('http://payment-service:8004'));