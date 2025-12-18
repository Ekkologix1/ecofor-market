'use client';
import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Package, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* 1️⃣  Assets ————————————————————————— */
const FALLBACK_IMAGE =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ' +
  'width="160" height="220"><rect width="100%" height="100%" ' +
  'fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle"' +
  ' text-anchor="middle" fill="%234a5568" font-size="18">Producto</text></svg>';

/* 2️⃣  Config ————————————————————————— */
const CARD_W = 280;
const CARD_H = 380; // Altura ajustada para tarjetas simplificadas
const RADIUS = 320; // Radio más pequeño para productos más cerca
const AUTOSPIN_SPEED = 0.05; // Velocidad más rápida

/* 3️⃣  Interfaces ————————————————————————— */
interface FeaturedProduct {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  sku: string
  basePrice: number
  wholesalePrice: number | null
  brand: string | null
  unit: string
  mainImage: string | null
  promotion: boolean
  promotionPrice: number | null
  promotionStart: string | null
  promotionEnd: string | null
  category: {
    id: string
    name: string
    slug: string
  }
}

interface ProductCardProps {
  product: FeaturedProduct;
  transform: string;
  cardW: number;
  cardH: number;
}

interface FeaturedProducts3DCarouselProps {
  products: FeaturedProduct[];
  radius?: number;
  cardW?: number;
  cardH?: number;
}

/* 4️⃣  Product Card Component (Memoized for Performance) ——— */
const ProductCard = React.memo(({ product, transform, cardW, cardH }: ProductCardProps) => {
  // Colores para las categorías
  const getCategoryColors = (categorySlug: string) => {
    switch (categorySlug) {
      case 'papeleria':
        return {
          bg: 'from-blue-100 to-blue-50',
          icon: 'text-blue-600',
          badge: 'text-blue-600 bg-blue-100',
          hover: 'from-blue-500/20'
        }
      case 'quimicos':
        return {
          bg: 'from-emerald-100 to-emerald-50',
          icon: 'text-emerald-600',
          badge: 'text-emerald-600 bg-emerald-100',
          hover: 'from-emerald-500/20'
        }
      case 'limpieza':
        return {
          bg: 'from-purple-100 to-purple-50',
          icon: 'text-purple-600',
          badge: 'text-purple-600 bg-purple-100',
          hover: 'from-purple-500/20'
        }
      case 'epp-horeca':
        return {
          bg: 'from-orange-100 to-orange-50',
          icon: 'text-orange-600',
          badge: 'text-orange-600 bg-orange-100',
          hover: 'from-orange-500/20'
        }
      default:
        return {
          bg: 'from-gray-100 to-gray-50',
          icon: 'text-gray-600',
          badge: 'text-gray-600 bg-gray-100',
          hover: 'from-gray-500/20'
        }
    }
  }

  const categoryColors = getCategoryColors(product.category.slug);

  return (
    <div
      className="absolute"
      style={{
        width: cardW,
        height: cardH,
        transform,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <div
        className={`w-full h-full rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-200
                   transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:z-10
                   ${categoryColors.bg} bg-gradient-to-br`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="relative h-full flex flex-col">
          {/* Imagen del producto */}
          <div className="relative flex-1 bg-white flex items-center justify-center p-6">
            {product.mainImage ? (
              <Image
                src={product.mainImage}
                alt={product.name}
                width={120}
                height={120}
                className="object-contain"
                quality={90}
                style={{ width: "auto", height: "auto" }}
                sizes="120px"
              />
            ) : (
              <Package className="h-16 w-16 text-gray-400" />
            )}
            
            {/* Badge Oferta */}
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                Oferta
              </div>
            </div>
          </div>

          {/* Información del producto */}
          <div className="p-4 bg-white/95 backdrop-blur-sm flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-3 leading-tight">
              {product.name}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

/* 5️⃣  Main 3D Carousel Component —————————————————— */
const FeaturedProducts3DCarousel = React.memo(
  ({
    products,
    radius = RADIUS,
    cardW = CARD_W,
    cardH = CARD_H,
  }: FeaturedProducts3DCarouselProps) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const wheelRef = useRef<HTMLDivElement>(null);
    const rotationRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);
    const isAnimatingRef = useRef(false);

    // Función de animación memoizada para evitar recreaciones
    const animate = useCallback(() => {
      // Aplicar rotación continua
      rotationRef.current += AUTOSPIN_SPEED;

      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotateY(${rotationRef.current}deg)`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
      // Solo iniciar la animación si no está ya corriendo
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        isAnimatingRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [animate]); // Solo depende de la función memoizada

    /* Pre-compute card transforms (only re-computes if products/radius change) */
    const cards = useMemo(
      () =>
        products.map((product, idx) => {
          const angle = (idx * 360) / products.length;
          return {
            key: product.id,
            product,
            transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
          };
        }),
      [products, radius]
    );

    return (
      <div
        ref={parentRef}
        className="w-full h-full flex items-center justify-center overflow-hidden font-sans"
        style={{ userSelect: 'none' }}
      >
        <div
          className="relative"
          style={{
            perspective: 1500,
            perspectiveOrigin: 'center',
            width: Math.max(cardW * 1.5, radius * 2.2), // Ajustado para radio más pequeño
            height: Math.max(cardH * 1.8, radius * 1.5), // Ajustado para tarjetas más altas
          }}
        >
          <div
            ref={wheelRef}
            className="relative"
            style={{
              width: cardW,
              height: cardH,
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginLeft: -cardW / 2,
              marginTop: -cardH / 2,
            }}
          >
            {cards.map(card => (
              <ProductCard
                key={card.key}
                product={card.product}
                transform={card.transform}
                cardW={cardW}
                cardH={cardH}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

FeaturedProducts3DCarousel.displayName = 'FeaturedProducts3DCarousel';

export default FeaturedProducts3DCarousel;
