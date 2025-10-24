// sistema-eventos/frontend/src/App.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// --- Configuração do Axios (API) ---
const api = axios.create({ baseURL: 'http://localhost:8000' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Estilos CSS (Versão Centralizada) ---
const styles: { [key: string]: React.CSSProperties } = {
  app: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#1e1e1e', color: '#f0f0f0', minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  header: { fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem', flexShrink: 0, width: '100%', boxSizing: 'border-box' },
  mainContainer: { display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1600px', width: '100%', margin: '0 auto', boxSizing: 'border-box', flexGrow: 1 },
  rowContainer: { display: 'flex', flexDirection: 'row', gap: '2rem', width: '100%', boxSizing: 'border-box', alignItems: 'stretch' },
  card: { flex: '1 1 0px', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '8px', padding: '1.5rem', boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', minWidth: '300px', display: 'flex', flexDirection: 'column' },
  cardTitle: { fontSize: '1.5rem', fontWeight: 600, borderBottom: '2px solid #555', paddingBottom: '0.5rem', marginBottom: '1rem', flexShrink: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { fontSize: '1rem', padding: '0.75rem', backgroundColor: '#333', border: '1px solid #555', borderRadius: '4px', color: '#f0f0f0', boxSizing: 'border-box' },
  select: { fontSize: '1rem', padding: '0.75rem', backgroundColor: '#333', border: '1px solid #555', borderRadius: '4px', color: '#f0f0f0', boxSizing: 'border-box' },
  checkboxContainer: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  checkboxLabel: { cursor: 'pointer' },
  buttonGroup: { display: 'flex', gap: '0.5rem' },
  button: { /* Removido flex: 1 */ fontSize: '1rem', padding: '0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 },
  buttonPrimary: { backgroundColor: '#007bff', color: 'white' },
  buttonSecondary: { backgroundColor: '#555', color: 'white' },
  buttonDanger: { backgroundColor: '#dc3545', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' },
  buttonSuccess: { backgroundColor: '#28a745', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem' },
  message: { textAlign: 'center', padding: '0.5rem', borderRadius: '4px', marginTop: '1rem', boxSizing: 'border-box', flexShrink: 0, width: '100%', margin: '0 auto 1rem auto' },
  eventList: { listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 },
  eventItem: { backgroundColor: '#333', padding: '1rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  eventDetails: { display: 'flex', flexDirection: 'column', gap: '0.2rem'},
  eventLocation: { fontSize: '0.9rem', color: '#aaa', marginLeft: '0.5rem' },
  eventPrice: { fontSize: '0.9rem', color: '#5cb85c', fontWeight: 'bold' },
  eventActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  bookingItem: { backgroundColor: '#333', padding: '0.75rem 1rem', borderRadius: '4px' },
  bookingStatus: {fontSize: '0.8rem', marginLeft: '1rem', padding: '0.2rem 0.4rem', borderRadius: '4px'},
  statusConfirmed: {backgroundColor: '#28a745', color: 'white'},
  statusPending: {backgroundColor: '#f0ad4e', color: 'black'},
  statusFailed: {backgroundColor: '#d9534f', color: 'white'},
  deletedEvent: { fontStyle: 'italic', color: '#aaa', textDecoration: 'line-through' }
};
// --- Fim dos Estilos ---

// --- Definição de Tipos ---
interface Event { id: number; nome: string; local: string; ownerId: number; isPaid: boolean; price: number; }
interface Booking { id: number; userId: number; eventId: number; userEmail: string; date: Date; status: 'pending' | 'confirmed' | 'failed'; transactionId?: string; }
interface DecodedToken { id: number; email: string; role: 'creator' | 'attendee'; iat: number; exp: number; }
// --- Fim dos Tipos ---


function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'creator' | 'attendee'>('attendee');
  const [newEventName, setNewEventName] = useState('');
  const [newEventLocal, setNewEventLocal] = useState('');
  const [newEventIsPaid, setNewEventIsPaid] = useState(false);
  const [newEventPrice, setNewEventPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<DecodedToken | null>(null);

  const updateUserFromToken = () => { /* ... (código igual) ... */
      const token = localStorage.getItem('authToken');
      if (token) {
          try {
              const decoded = jwtDecode<DecodedToken>(token);
              setLoggedInUser(decoded);
          } catch (error) {
              console.error("Token inválido:", error);
              localStorage.removeItem('authToken');
              setLoggedInUser(null);
          }
      } else {
          setLoggedInUser(null);
      }
  };

  const showFeedback = (msg: string, error: boolean = false) => { /* ... (código igual) ... */
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    updateUserFromToken();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      fetchMyBookings();
    } else {
      setMyBookings([]);
    }
  }, [loggedInUser]);


  const fetchEvents = async () => { /* ... (código igual) ... */
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Erro ao buscar eventos!', error);
      showFeedback('Não foi possível carregar os eventos.', true);
    }
  };

  const fetchMyBookings = async () => { /* ... (código igual) ... */
    if (!loggedInUser) return;
    try {
      const response = await api.get('/bookings/my-bookings');
      setMyBookings(response.data);
    } catch (error) {
      console.error('Erro ao buscar inscrições!', error);
    }
  };

  const handleRegister = async () => { /* ... (código igual) ... */
    if (!email || !password) {
      showFeedback('Preencha email e senha.', true);
      return;
    }
    try {
      const response = await api.post('/auth/register', { email, password, role: selectedRole });
      showFeedback(response.data.message, false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      showFeedback(error.response?.data?.message || 'Erro ao registrar.', true);
    }
  };

  const handleLogin = async () => { /* ... (código igual com verificação de role) ... */
    if (!email || !password) {
      showFeedback('Preencha email e senha.', true);
      return;
    }
    try {
      const response = await api.post('/auth/login', { email, password });
      const actualRole = response.data.role;
      const token = response.data.token;

      if (selectedRole !== actualRole) {
          const selectedRolePt = selectedRole === 'creator' ? 'criador de eventos' : 'participante';
          const actualRolePt = actualRole === 'creator' ? 'criador de eventos' : 'participante';
          showFeedback(`Login falhou: você tentou logar como '${selectedRolePt}' mas sua conta é '${actualRolePt}'. Mude a opção no dropdown.`, true);
          return;
      }

      localStorage.setItem('authToken', token);
      updateUserFromToken();
      showFeedback('Login com sucesso!', false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      showFeedback(error.response?.data?.message || 'Erro ao logar.', true);
    }
  };

  const handleLogout = () => { /* ... (código igual) ... */
    localStorage.removeItem('authToken');
    setLoggedInUser(null);
    showFeedback('Você foi desconectado.', false);
  };

  const handleCreateEvent = async () => { /* ... (código igual) ... */
      if (loggedInUser?.role !== 'creator') {
          showFeedback('Apenas criadores podem adicionar eventos.', true);
          return;
      }
      if (!newEventName || !newEventLocal) {
          showFeedback('Preencha nome e local do evento.', true);
          return;
      }
      let priceNumber = 0;
      if (newEventIsPaid) {
          priceNumber = parseFloat(newEventPrice) * 100;
          if (isNaN(priceNumber) || priceNumber <= 0) {
              showFeedback('Preço inválido para evento pago.', true);
              return;
          }
      }

    try {
      await api.post('/events', {
          nome: newEventName,
          local: newEventLocal,
          isPaid: newEventIsPaid,
          price: priceNumber
      });
      showFeedback('Evento criado com sucesso!', false);
      setNewEventName('');
      setNewEventLocal('');
      setNewEventIsPaid(false);
      setNewEventPrice('');
      fetchEvents();
    } catch (error: any) {
      showFeedback(error.response?.data?.message || 'Erro ao criar evento.', true);
    }
  };

  const handleDeleteEvent = async (eventId: number) => { /* ... (código igual) ... */
    if (!window.confirm("Tem certeza que deseja deletar este evento?")) return;
    try {
      await api.delete(`/events/${eventId}`);
      showFeedback('Evento deletado com sucesso.', false);
      fetchEvents();
    } catch (error: any) {
      showFeedback(error.response?.data?.message || 'Erro ao deletar evento.', true);
    }
  };

  const handleBookEvent = async (event: Event) => { /* ... (código igual) ... */
    const eventId = event.id;
    if (event.isPaid) {
        const priceFormatted = (event.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (!window.confirm(`Este evento é pago (${priceFormatted}). Deseja continuar com a inscrição e pagamento?`)) {
            return;
        }
    }

    try {
      const response = await api.post(`/bookings/${eventId}`);
      if (response.status === 201 && response.data.status === 'confirmed') {
          showFeedback(`Inscrição ${event.isPaid ? 'e pagamento' : ''} realizada com sucesso!`, false);
      } else if (response.status === 402 && response.data.status === 'failed') {
           showFeedback('Inscrição pendente: Falha no pagamento.', true);
      } else if (response.status === 201 && response.data.status === 'pending') {
           showFeedback('Inscrição pendente. Não foi possível processar pagamento agora.', false);
      } else {
           showFeedback('Inscrição realizada (status desconhecido).', false);
      }
      fetchMyBookings();
    } catch (error: any) {
      showFeedback(error.response?.data?.message || 'Erro ao se inscrever.', true);
    }
  };

  const formatPrice = (priceInCents: number) => { /* ... (código igual) ... */
      return (priceInCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- Renderização da Interface ---
  return (
    <div style={styles.app}>
      <h1 style={styles.header}>Sistema de Gestão de Eventos</h1>

      {/* Link para o GitHub ADICIONADO AQUI */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '-1rem' }}>
        <a href="https://github.com/antoinec8" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', fontSize: '0.9rem', textDecoration: 'none' }}>
          GitHub: antoinec8
        </a>
      </div>

      {message && (
        <p style={{ ...styles.message, backgroundColor: isError ? '#dc3545' : '#28a745', color: 'white', /* Removido width/maxWidth */ margin: '0 auto 1rem auto', boxSizing: 'border-box' }}>
          {message}
        </p>
      )}

      <div style={styles.mainContainer}>
        {/* Primeira linha de cards */}
        <div style={styles.rowContainer}>
          {/* Card de Autenticação */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Login / Registro</h2>
            {loggedInUser ? (
              <button onClick={handleLogout} style={{ ...styles.button, ...styles.buttonPrimary }}>
                Logout
              </button>
            ) : (
              <div style={styles.form}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
                <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as 'creator' | 'attendee')} style={styles.select}>
                    <option value="attendee">Quero participar</option>
                    <option value="creator">Quero criar eventos</option>
                </select>
                <div style={styles.buttonGroup}>
                  <button onClick={handleRegister} style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}>Registrar</button>
                  <button onClick={handleLogin} style={{ ...styles.button, ...styles.buttonPrimary, flex: 1 }}>Logar</button>
                </div>
              </div>
            )}
          </div>

          {/* Card de Eventos */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Eventos</h2>
            <ul style={styles.eventList}>
              {
                events.length > 0 ? (
                  events.map((event: Event) => (
                    <li key={event.id} style={styles.eventItem}>
                      <div style={styles.eventDetails}>
                        <strong>{event.nome}</strong>
                        <span style={styles.eventLocation}>({event.local})</span>
                        {event.isPaid ? (
                            <span style={styles.eventPrice}>{formatPrice(event.price)}</span>
                        ) : (
                            <span style={styles.eventPrice}>Gratuito</span>
                        )}
                      </div>
                      {loggedInUser && (
                        <div style={styles.eventActions}>
                          {loggedInUser.role === 'attendee' && (
                              <button onClick={() => handleBookEvent(event)} style={{ ...styles.button, ...styles.buttonSuccess }}>Inscrever-se</button>
                          )}
                          {(event.ownerId === loggedInUser.id || loggedInUser.role === 'creator') && (
                              <button onClick={() => handleDeleteEvent(event.id)} style={{ ...styles.button, ...styles.buttonDanger }}>Deletar</button>
                          )}
                        </div>
                      )}
                    </li>
                  ))
                ) : (
                  <p>Nenhum evento encontrado.</p>
                )
              }
            </ul>
          </div>
        </div>

        {/* Container de "Logado" */}
        {loggedInUser && (
          <div style={{ ...styles.rowContainer, marginTop: '2rem' }}>
            {/* Card de Criar Evento */}
            {loggedInUser.role === 'creator' && (
                <div style={styles.card}>
                  <h2 style={styles.cardTitle}>Criar Novo Evento</h2>
                  {
                      <div style={styles.form}>
                        <input type="text" placeholder="Nome do Evento" value={newEventName} onChange={(e) => setNewEventName(e.target.value)} style={styles.input} />
                        <input type="text" placeholder="Local do Evento" value={newEventLocal} onChange={(e) => setNewEventLocal(e.target.value)} style={styles.input} />
                        <div style={styles.checkboxContainer}>
                            <input type="checkbox" id="isPaidCheckbox" checked={newEventIsPaid} onChange={(e) => setNewEventIsPaid(e.target.checked)} />
                            <label htmlFor="isPaidCheckbox" style={styles.checkboxLabel}>Evento Pago?</label>
                        </div>
                        {newEventIsPaid && (
                            <input type="number" placeholder="Preço (ex: 25.00)" value={newEventPrice} onChange={(e) => setNewEventPrice(e.target.value)} style={styles.input} min="0.01" step="0.01" />
                        )}
                        <button onClick={handleCreateEvent} style={{ ...styles.button, ...styles.buttonPrimary }}>Criar Evento</button>
                      </div>
                  }
                </div>
            )}

            {/* Card Minhas Inscrições */}
            <div style={{...styles.card, flexGrow: loggedInUser.role !== 'creator' ? 2 : 1 }}>
              <h2 style={styles.cardTitle}>Minhas Inscrições</h2>
              <ul style={styles.eventList}>
                {
                    myBookings.length > 0 ? (
                      myBookings.map((booking: Booking) => {
                        const event = events.find(e => e.id === booking.eventId);
                        let statusStyle = styles.statusPending;
                        if (booking.status === 'confirmed') statusStyle = styles.statusConfirmed;
                        if (booking.status === 'failed') statusStyle = styles.statusFailed;

                        return (
                          <li key={booking.id} style={styles.bookingItem}>
                            {event ? (
                              <>
                                  Inscrito no evento: <strong>{event.nome}</strong>
                                  <span style={{...styles.bookingStatus, ...statusStyle}}>
                                      {booking.status === 'confirmed' ? 'Confirmado' : booking.status === 'pending' ? 'Pendente' : 'Falhou'}
                                  </span>
                              </>
                            ) : (
                              <span style={styles.deletedEvent}>Inscrição para evento removido (ID: {booking.eventId})</span>
                            )}
                          </li>
                        );
                      })
                    ) : (
                      <p>Você ainda não se inscreveu em nenhum evento.</p>
                    )
                }
              </ul>
            </div>
          </div>
        )}
      </div> {/* Fim do mainContainer */}
    </div> // Fim do app
  );
}

export default App;