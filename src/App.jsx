import Header from './components/Header.jsx';
import Home from './components/Home/Home.jsx';
import CakeStyles from './components/CakeStyles.jsx';
import PriceList from './components/PriceList.jsx';
import OtherProducts from './components/OtherProducts.jsx';
import ContactForm from './components/ContactForm.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Home />
        <CakeStyles />
        <PriceList />
        <OtherProducts />
        <ContactForm />
        <Footer />
      </main>
    </>
  );
}
