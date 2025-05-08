'use client';

import Slider from 'react-slick';
import Image from 'next/image';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const products = [
  {
    src: '/slika1.jpeg',
    price: 'od 66,00 €',
    title: 'Nepozabni dan v ribjem vrtu Fonda',
  },
  {
    src: '/krompir.jpg',
    price: 'od 119,00 €',
    title: 'Mojster Plečnik',
  },
  {
    src: '/jagode.png',
    price: 'od 115,00 €',
    title: 'Meet Meat & Eat – zgodba o mesu, za katerega si je vredno vzeti čas',
  },
];

export default function ProductCarousel() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <div className="w-full bg-white py-14">
      <div className="mx-auto max-w-[1920px]">
        <Slider {...settings}>
          {products.map((item, idx) => (
            <div key={idx} className="px-4">
              <div className="group relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-xl transition duration-300">
                {/* Image */}
                <div className="relative h-[400px] w-full overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.title}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}
