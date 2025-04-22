export default function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} The Quick Shop. All rights reserved.</p>
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
  )
}
