import Header from './components/Header/Header.jsx';
import Home from './components/Home/Home.jsx';
import CakeStyles from './components/CakeStyles/CakeStyles.jsx';
import Cardapio from './components/Cardapio/Cardapio.jsx';
import Delivery from './components/Delivery/Delivery.jsx';
import ContactForm from './components/ContactForm/ContactForm.jsx';
import Footer from './components/Footer/Footer.jsx';
import Sacola from './components/Sacola/Sacola.jsx';
import { SacolaProvider } from './context/SacolaContext.jsx';
import { ConteudoProvider } from './context/ConteudoContext.jsx';

export default function App() {
  return (
    <ConteudoProvider>
      <SacolaProvider>
        <Header />
        <main>
          <Home />
          <CakeStyles />
          <Cardapio />
          <Delivery />
          <ContactForm />
        </main>
        <Footer />
        <Sacola />
      </SacolaProvider>
    </ConteudoProvider>
  );
}
