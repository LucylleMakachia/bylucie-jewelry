import React from 'react';

export default function Home() {
  return (
    <main className="bg-white dark:bg-gray-900 text-[#002200] dark:text-white min-h-screen flex flex-col items-center px-6 md:px-12 py-12 font-serif">
      
      {/* Headline - CENTERED */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-4xl mb-12 p-8 text-center">
        <h1 className="text-6xl font-bold mb-8 tracking-wide" style={{ color: '#ffd700' }}>
          LUXURY GOLD RING
        </h1>
      </div>

      {/* Two hero images side-by-side - FIXED & CENTERED */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-7xl mb-12 p-8 flex justify-center">
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center w-full">
          <img 
            src="/images/hero1.jpg" 
            alt="Lux gold ring 1" 
            className="w-full md:w-1/2 max-w-md object-cover h-64 md:h-80" 
          />
          <img 
            src="/images/hero2.jpg" 
            alt="Lux gold ring 2" 
            className="w-full md:w-1/2 max-w-md object-cover h-64 md:h-80" 
          />
        </div>
      </div>

      {/* About ByLucie - CENTERED */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-4xl mb-12 p-8 text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#ffd700" }}>
          ABOUT BYLUCIE
        </h2>
        <p className="uppercase text-base md:text-lg text-[#b8860b] dark:text-yellow-200 tracking-widest leading-relaxed">
          Welcome to ByLucie, where we specialize in the art of crafting moments in gold and diamonds. Each piece is a beautiful celebration, carefully designed to capture the essence of precious moments.
        </p>
      </section>

      {/* Three feature cards - FIXED & CENTERED */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-7xl mb-12 p-8 flex justify-center">
        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch w-full">
          {[
            {
              img: '/images/trends.jpg',
              title: 'Latest Trends',
              caption: 'Visual jewelry art, carefully crafted, creating an elegant and modern style',
            },
            {
              img: '/images/diamonds.jpg',
              title: 'Diamond Collection',
              caption: 'Our latest and iconic collection, crafted to last beyond years',
            },
            {
              img: '/images/custom.jpg',
              title: 'Custom Jewelry',
              caption: 'Designed tailor to your taste, creating a valuable work of art',
            },
          ].map(({ img, title, caption }) => (
            <div key={title} className="relative flex-1 group cursor-pointer overflow-hidden flex flex-col max-w-sm">
              <img 
                src={img} 
                alt={title} 
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" 
              />
              <div className="absolute bottom-6 left-6 right-6 text-white bg-gradient-to-t from-[#002200cc] dark:from-[#000000cc] to-transparent p-6 text-center">
                <h3 className="text-xl font-bold mb-2" style={{ color: "#ffd700" }}>{title}</h3>
                <p className="text-sm max-w-xs mb-3">{caption}</p>
                <button
                  className="mt-2 px-5 py-2 font-semibold bg-[#ff8c00] text-white hover:bg-[#ff5000] transition"
                >
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Selling Product - FIXED & CENTERED */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-7xl mb-12 p-8 text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-2 tracking-wide" style={{ color: "#ffd700" }}>
          BEST SELLING PRODUCT
        </h2>
        <p className="text-[#b8860b] dark:text-yellow-200 uppercase text-sm tracking-wide mb-8 max-w-2xl">
          A collection designed to enhance everyday wear with exceptional premium quality—classic and beautiful, always.
        </p>

        {/* Product Grid - 3 COLUMNS FIXED */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[...Array(9)].map((_, idx) => (
            <div key={idx} className="text-center border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 flex flex-col items-center">
              <img 
                src={`/images/product${idx+1}.jpg`} 
                alt={`Product ${idx + 1}`} 
                className="w-48 h-48 object-cover max-w-full"
              />
              <h4 className="mt-3 font-medium text-sm uppercase" style={{ color: "#ff8c00" }}>
                Product Name {idx + 1}
              </h4>
              <p className="text-[#b8860b] dark:text-yellow-200 font-bold">$298.00</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-[#ffc200] text-[#002200] dark:bg-[#ff8c00] dark:text-white font-bold hover:bg-[#ff8c00] dark:hover:bg-[#ff5000] transition">
            Explore More Jewelry
          </button>
        </div>
      </section>

      {/* Latest Article - FIXED & CENTERED */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-7xl mb-12 p-8 text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-8 tracking-wide" style={{ color: "#ffd700" }}>
          LATEST ARTICLE
        </h2>
        <p className="uppercase text-sm tracking-widest text-[#b8860b] dark:text-yellow-200 mb-10 max-w-3xl">
          Articles that provide education, inspiration and insights on jewelry, diamonds, and smart investing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[...Array(3)].map((_, idx) => (
            <article key={idx} className="overflow-hidden cursor-pointer hover:shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
              <img 
                src={`/images/article${idx+1}.jpg`} 
                alt={`Article ${idx+1}`} 
                className="w-64 h-48 object-cover"
              />
              <div className="p-5 text-center">
                <h3 className="font-bold mb-2" style={{ color: "#ff8c00" }}>
                  Article Title {idx + 1}
                </h3>
                <p className="text-sm text-[#b8860b] dark:text-yellow-200">
                  Short summary that highlights the story or advice for jewelry lovers.
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Banner Section - FIXED & CENTERED */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-7xl mb-12 p-0 overflow-hidden flex justify-center">
        <div
          className="relative flex flex-col items-center justify-center text-center py-32 w-full max-w-full"
          style={{
            backgroundImage: "url('/images/banner.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            color: '#fff',
          }}
        >
          <div className="bg-[#002200bb] dark:bg-[#000000bb] absolute inset-0"></div>
          <h2 className="relative z-10 text-4xl md:text-5xl font-bold max-w-3xl px-4" style={{ color: "#ffd700" }}>
            MADE WITH TRAINED AND RESPONSIBLE HANDS
          </h2>
          <p className="relative z-10 uppercase mt-4 max-w-xl text-sm md:text-base tracking-widest text-[#ffc200] px-4">
            A collection designed for a younger generation—exceptional quality, responsibly crafted.
          </p>
          <button className="relative z-10 mt-8 px-8 py-3 bg-[#ff5000] text-white font-bold hover:bg-[#ff8c00] transition">
            Shop Now
          </button>
        </div>
      </section>
    </main>
  );
}