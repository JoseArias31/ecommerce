export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>The Quick Shop</title>
        <meta name="description" content="A minimalist e-commerce store" />
      </head>
      <body>
        <div className="flex flex-col min-h-screen">
          <nav className="border-b">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="text-4xl font-bold">The Quick Shop</div>

              <div className="flex items-center space-x-4">
                <div className="p-2 relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="21" r="1"></circle>
                    <circle cx="19" cy="21" r="1"></circle>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center ">
          2
              </span>
                </div>
                <div className="p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-grow">{children}</main>
          <footer className="border-t mt-12">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Modern E-Commerce. All rights reserved.
                </p>
                <div className="flex space-x-4 mt-4 md:mt-0">
                  <a href="#" className="text-sm text-gray-600 hover:text-black">
                    Terms
                  </a>
                  <a href="#" className="text-sm text-gray-600 hover:text-black">
                    Privacy
                  </a>
                  <a href="#" className="text-sm text-gray-600 hover:text-black">
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
