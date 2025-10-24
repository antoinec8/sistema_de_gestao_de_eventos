// services/payment-service/src/index.ts
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// --- Rota: Processar Pagamento (Simulado) ---
app.post('/process-payment', (req, res) => {
  const { bookingId, amount } = req.body;

  console.log(`Payment Service: Recebido pedido para processar pagamento da inscrição ${bookingId}, valor: ${amount}`);

  // Simulação simples: Pagamentos abaixo de 50 falham, acima ou igual, sucesso.
  const paymentSuccess = amount >= 10; // Vamos simular que R$10 ou mais sempre funciona

  if (paymentSuccess) {
    console.log(`Payment Service: Pagamento para inscrição ${bookingId} APROVADO.`);
    // Em um sistema real, aqui você interagiria com um gateway de pagamento (Stripe, PagSeguro, etc.)
    // e retornaria um ID de transação.
    res.status(200).json({
      success: true,
      message: 'Pagamento aprovado',
      transactionId: `TRANS_${Date.now()}` // ID de transação simulado
    });
  } else {
    console.log(`Payment Service: Pagamento para inscrição ${bookingId} RECUSADO.`);
    res.status(400).json({
      success: false,
      message: 'Pagamento recusado (Valor baixo ou simulação de falha)'
    });
  }
});

app.listen(8004, () => {
  console.log('Payment-Service (SPL) rodando na porta 8004');
});