import React, { useState } from 'react';
import { Sparkles, ShoppingBag, MessageSquare, Check, Plus, Trash2, Tag, Edit2 } from 'lucide-react';

export default function ProductsSection({ 
  products, 
  onReserveProduct
}) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredProducts = products.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <section id="productos" style={{ padding: 'clamp(4rem, 8vw, 6.5rem) 0', backgroundColor: '#fafafa', borderBottom: '1px solid #09090b' }}>
      <div className="editorial-container">
        {/* Header & Category Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', gap: '1.5rem' }}>
          <div>
            <div className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#71717a', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              [02] CATÁLOGO OFICIAL // HUELVA
            </div>
            <h2 className="font-headline" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              PERFUMES & PRODUCTOS
            </h2>
          </div>

          <p className="font-mono" style={{ fontSize: '0.8125rem', color: '#71717a', maxWidth: '340px', textTransform: 'uppercase', lineHeight: 1.5 }}>
            Selección exclusiva de perfumes de autor y productos técnicos de acabado. Reserva sin coste.
          </p>
        </div>

        {/* Category Segmented Tabs (Tech Brutalist Pulido) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }} className="font-mono">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid #09090b',
              backgroundColor: activeCategory === 'all' ? '#09090b' : '#ffffff',
              color: activeCategory === 'all' ? '#ffffff' : '#09090b',
              borderRadius: '4px',
              transition: 'all 0.15s cubic-bezier(0.23, 1, 0.32, 1)'
            }}
          >
            TODOS ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('perfumes')}
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid #09090b',
              backgroundColor: activeCategory === 'perfumes' ? '#09090b' : '#ffffff',
              color: activeCategory === 'perfumes' ? '#ffffff' : '#09090b',
              borderRadius: '4px',
              transition: 'all 0.15s cubic-bezier(0.23, 1, 0.32, 1)'
            }}
          >
            PERFUMES ({products.filter(p => p.category === 'perfumes').length})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('peluqueria')}
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid #09090b',
              backgroundColor: activeCategory === 'peluqueria' ? '#09090b' : '#ffffff',
              color: activeCategory === 'peluqueria' ? '#ffffff' : '#09090b',
              borderRadius: '4px',
              transition: 'all 0.15s cubic-bezier(0.23, 1, 0.32, 1)'
            }}
          >
            PRODUCTOS DE PELUQUERÍA ({products.filter(p => p.category === 'peluqueria').length})
          </button>
        </div>        {/* Products Grid (2 columns on mobile) */}
        <div className="products-catalog-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card-mobile"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #09090b',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              {/* Product Image Area */}
              <div 
                className="product-image-container-mobile"
                style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#f4f4f5', borderBottom: '1px solid #09090b', overflow: 'hidden' }}
              >
                <img
                  src={product.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80'}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(15%) contrast(105%)',
                    transition: 'filter 0.2s ease, transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%) contrast(100%)';
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(15%) contrast(105%)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />

                {/* Category & Tag Badges */}
                <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <span 
                    className="font-mono" 
                    style={{ 
                      backgroundColor: '#09090b', 
                      color: '#ffffff', 
                      fontSize: '0.5625rem', 
                      fontWeight: 700, 
                      padding: '0.15rem 0.4rem',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {product.category === 'perfumes' ? 'PERFUMERÍA' : 'PELUQUERÍA'}
                  </span>

                  {product.tag && (
                    <span 
                      className="font-mono" 
                      style={{ 
                        backgroundColor: '#ffffff', 
                        color: '#09090b', 
                        fontSize: '0.5625rem', 
                        fontWeight: 700, 
                        padding: '0.15rem 0.4rem', 
                        border: '1px solid #09090b',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {product.tag}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div style={{ padding: 'clamp(0.75rem, 2vw, 1.25rem)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="font-mono" style={{ fontSize: '0.625rem', color: '#71717a', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.2rem', textTransform: 'uppercase' }}>
                    {product.brand || 'JOAO STUDIO'}
                  </div>

                  <h3 className="font-headline product-title-mobile" style={{ fontSize: '1.15rem', color: '#09090b', marginBottom: '0.4rem', lineHeight: 1.2 }}>
                    {product.name}
                  </h3>

                  <p className="product-desc-mobile" style={{ fontSize: '0.8125rem', color: '#52525b', lineHeight: 1.4, marginBottom: '1rem', textWrap: 'pretty' }}>
                    {product.description}
                  </p>
                </div>

                <div>
                  {/* Price & Stock status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid #e4e4e7', paddingTop: '0.65rem', marginBottom: '0.85rem' }}>
                    <div>
                      <div className="font-mono" style={{ fontSize: '0.5625rem', color: '#71717a' }}>PRECIO</div>
                      <div className="font-headline product-price-mobile" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#09090b' }}>
                        {product.price_label || (product.price_eur ? `${product.price_eur.toFixed(2).replace('.', ',')} €` : 'Consultar')}
                      </div>
                    </div>

                    <div className="font-mono" style={{ fontSize: '0.5625rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                      STOCK DISP.
                    </div>
                  </div>

                  {/* Reservation button opening reservation modal */}
                  <button
                    type="button"
                    onClick={() => onReserveProduct ? onReserveProduct(product) : null}
                    className="btn-solid-black product-btn-mobile"
                    style={{ width: '100%', padding: '0.7rem 0.5rem', fontSize: '0.75rem', letterSpacing: '0.03em' }}
                  >
                    <ShoppingBag size={14} />
                    <span>RESERVAR</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote notice */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid #09090b', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="font-mono">
          <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
            * Todos los productos se adquieren o recogen directamente en nuestro estudio en Av. Alcalde Federico Molina Orta, 4.
          </span>
          <span style={{ fontSize: '0.75rem', color: '#09090b', fontWeight: 700 }}>
            PAGO CON TARJETA / BIZUM / EFECTIVO
          </span>
        </div>
      </div>
    </section>
  );
}
