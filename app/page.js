export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="group">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-4">
              <img
                src={product.image || "/placeholder.svg?height=500&width=500"}
                alt={product.name}
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300 w-full h-full"
              />
            </div>
            <h3 className="text-lg font-medium">{product.name}</h3>
            <p className="text-gray-600 mt-1">${product.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Sample product data
const products = [
  {
    id: 1,
    name: "Minimalist Watch",
    description: "A sleek, minimalist watch with a leather strap. Perfect for any occasion.",
    price: 129.99,
    image: "/placeholder.svg?height=500&width=500",
    category: "accessories",
  },
  {
    id: 2,
    name: "Modern Desk Lamp",
    description: "An elegant desk lamp with adjustable brightness. Adds style to any workspace.",
    price: 79.99,
    image: "/placeholder.svg?height=500&width=500",
    category: "home",
  },
  {
    id: 3,
    name: "Wireless Earbuds",
    description: "High-quality wireless earbuds with noise cancellation and long battery life.",
    price: 149.99,
    image: "/placeholder.svg?height=500&width=500",
    category: "electronics",
  },
  {
    id: 4,
    name: "Ceramic Mug Set",
    description: "Set of 4 handcrafted ceramic mugs. Each piece is unique and made with care.",
    price: 49.99,
    image: "/placeholder.svg?height=500&width=500",
    category: "home",
  },
  {
    id: 5,
    name: "Canvas Backpack",
    description: "Durable canvas backpack with leather details. Spacious and stylish.",
    price: 89.99,
    image: "/placeholder.svg?height=500&width=500",
    category: "accessories",
  },
  {
    id: 6,
    name: "Portable Bluetooth Speaker",
    description: "Compact Bluetooth speaker with impressive sound quality and 12-hour battery life.",
    price: 69.99,
    image: "/placeholder.svg?height=500&width=500",
    category: "electronics",
  },
]
