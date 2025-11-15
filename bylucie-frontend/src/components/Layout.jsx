import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white text-[#002200] font-serif">
      {/* Fixed Navbar with height offset */}
      <Navbar />

      {/* Add padding-top to account for fixed navbar height */}
      <main className="flex-grow pt-20 w-full flex flex-col items-center justify-start">
        {children}
      </main>

      <Footer />
    </div>
  )
}
