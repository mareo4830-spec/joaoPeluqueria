import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServicesMenu from './components/ServicesMenu';
import ProductsSection from './components/ProductsSection';
import TrustSection from './components/TrustSection';
import ReviewsSection from './components/ReviewsSection';
import LocationSection from './components/LocationSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import ProductReservationModal from './components/ProductReservationModal';
import LegalPage from './components/LegalPage';
import PrivacyBanner from './components/PrivacyBanner';
import AdminPage from './components/AdminPage';
import BarberAppointmentsPage from './components/BarberAppointmentsPage';
import { DEFAULT_SERVICES } from './data/servicesData';
import { DEFAULT_PRODUCTS } from './data/productsData';
import { fetchServices, fetchProducts, addProduct, updateProduct, deleteProduct } from './lib/supabase';
import './App.css';

const LEGAL_ROUTES = ['aviso-legal', 'politica-privacidad', 'politica-cookies', 'terminos-condiciones'];

export default function App() {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  
  // Routing: home, admin, citas, or legal pages
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname.toLowerCase().replace(/^\//, '');
    const hash = window.location.hash.toLowerCase().replace(/^#/, '');

    if (path === 'admin' || path.startsWith('admin/') || hash === 'admin') {
      return { type: 'admin' };
    }

    if (path === 'citas' || path.startsWith('citas/') || hash === 'citas') {
      return { type: 'citas' };
    }

    const legalSlug = LEGAL_ROUTES.find(r => path === r || hash === r);
    if (legalSlug) {
      return { type: 'legal', slug: legalSlug };
    }

    return { type: 'home' };
  });

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeProductToReserve, setActiveProductToReserve] = useState(null);
  const [activePreselectedService, setActivePreselectedService] = useState(null);

  // Sync route on URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase().replace(/^\//, '');
      const hash = window.location.hash.toLowerCase().replace(/^#/, '');

      if (path === 'admin' || path.startsWith('admin/') || hash === 'admin') {
        setCurrentRoute({ type: 'admin' });
      } else if (path === 'citas' || path.startsWith('citas/') || hash === 'citas') {
        setCurrentRoute({ type: 'citas' });
      } else {
        const legalSlug = LEGAL_ROUTES.find(r => path === r || hash === r);
        if (legalSlug) {
          setCurrentRoute({ type: 'legal', slug: legalSlug });
        } else {
          setCurrentRoute({ type: 'home' });
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Load services and products
  useEffect(() => {
    let isMounted = true;

    fetchServices(DEFAULT_SERVICES).then(({ data }) => {
      if (isMounted && data && data.length > 0) {
        setServices(data);
      }
    });

    fetchProducts(DEFAULT_PRODUCTS).then(({ data }) => {
      if (isMounted && data && data.length > 0) {
        setProducts(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenBooking = (service = null) => {
    setActivePreselectedService(service);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setActivePreselectedService(null);
  };

  // Admin Product Actions (Only callable from /admin)
  const handleAddProduct = async (productPayload) => {
    const { data } = await addProduct(productPayload, products);
    if (data) {
      setProducts((prev) => [data, ...prev]);
    }
  };

  const handleUpdateProduct = async (productId, productPayload) => {
    const { data } = await updateProduct(productId, productPayload, products);
    if (data) {
      setProducts((prev) => prev.map((p) => p.id === productId ? data : p));
    }
  };

  const handleDeleteProduct = async (productId) => {
    await deleteProduct(productId, products);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute({ type: 'home' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentRoute({ type: 'admin' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navigateToCitas = () => {
    window.history.pushState({}, '', '/citas');
    setCurrentRoute({ type: 'citas' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navigateToLegal = (slug) => {
    window.history.pushState({}, '', `/${slug}`);
    setCurrentRoute({ type: 'legal', slug });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // 1. IF USER IS ON /ADMIN, RENDER DEDICATED ADMIN PORTAL
  if (currentRoute.type === 'admin') {
    return (
      <div className="app-wrapper">
        <AdminPage
          products={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onNavigateHome={navigateToHome}
          onNavigateToCitas={navigateToCitas}
        />
        <PrivacyBanner onNavigateToLegal={navigateToLegal} />
      </div>
    );
  }

  // 2. IF USER IS ON /CITAS, RENDER DEDICATED BARBER APPOINTMENTS AGENDA
  if (currentRoute.type === 'citas') {
    return (
      <div className="app-wrapper">
        <BarberAppointmentsPage
          onNavigateHome={navigateToHome}
          onNavigateToAdmin={navigateToAdmin}
        />
        <PrivacyBanner onNavigateToLegal={navigateToLegal} />
      </div>
    );
  }

  // 3. IF USER IS ON A LEGAL ROUTE (/aviso-legal, /politica-privacidad, etc.)
  if (currentRoute.type === 'legal') {
    return (
      <div className="app-wrapper">
        <LegalPage
          currentSlug={currentRoute.slug}
          onNavigateLegal={navigateToLegal}
          onNavigateHome={navigateToHome}
        />
        <PrivacyBanner onNavigateToLegal={navigateToLegal} />
      </div>
    );
  }

  // 4. PUBLIC BARBERSHOP WEBSITE
  return (
    <div className="app-wrapper">
      {/* Navigation Header */}
      <Navbar 
        onOpenBooking={handleOpenBooking} 
        onNavigateToAdmin={navigateToAdmin}
        onNavigateToCitas={navigateToCitas}
      />

      {/* Main Content Sections */}
      <main>
        <Hero 
          onOpenBooking={handleOpenBooking} 
        />

        <ServicesMenu 
          services={services} 
          onSelectService={(srv) => handleOpenBooking(srv)} 
        />

        {/* 100% Public Products Section */}
        <ProductsSection
          products={products}
          onReserveProduct={(product) => setActiveProductToReserve(product)}
        />

        <TrustSection />

        <ReviewsSection />

        <LocationSection 
          onOpenBooking={handleOpenBooking} 
        />
      </main>

      {/* Public Footer with GDPR Legal Links */}
      <Footer 
        onOpenBooking={handleOpenBooking} 
        onNavigateToLegal={navigateToLegal}
      />

      {/* Interactive Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        initialService={activePreselectedService}
        services={services}
      />

      {/* Product Reservation Modal */}
      <ProductReservationModal
        isOpen={Boolean(activeProductToReserve)}
        onClose={() => setActiveProductToReserve(null)}
        product={activeProductToReserve}
      />

      {/* GDPR Minimalist Privacy & Cookie Consent Banner */}
      <PrivacyBanner 
        onNavigateToLegal={navigateToLegal} 
      />
    </div>
  );
}
