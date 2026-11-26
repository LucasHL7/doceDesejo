import Header from './components/Header/Header.jsx';
import Home from './components/Home/Home.jsx';
import CakeStyles from './components/CakeStyles/CakeStyles.jsx';
import Cardapio from './components/Cardapio/Cardapio.jsx';
import Delivery from './components/Delivery/Delivery.jsx';
import ContactForm from './components/ContactForm/ContactForm.jsx';
import Footer from './components/Footer.jsx';
import Sacola from './components/Sacola/Sacola.jsx';
import { SacolaProvider } from './context/SacolaContext.jsx';

export default function App() {
  return (
    <SacolaProvider>
      <Header />
      <main>
        <Home />
        <CakeStyles />
        <Cardapio />
        <Delivery />
        <ContactForm />
        <Footer />
      </main>
      <Sacola />
    </SacolaProvider>
  );
}
