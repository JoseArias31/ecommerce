"use client"

import { useState } from "react"
import { Send, Phone, MapPin, Mail } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitMessage({
        type: "success",
        text: "Thank you! Your message has been sent successfully.",
      })
      setFormData({ name: "", email: "", subject: "", message: "" })
    }, 1500)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* Contact Information */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-6">Get in Touch</h2>
            <p className="text-gray-700 mb-8">
              Have questions about our products or your order? We're here to help. Fill out the form or use our contact
              information below.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Phone className="w-5 h-5 text-gray-700 mt-1" />
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Mail className="w-5 h-5 text-gray-700 mt-1" />
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-gray-600">support@thequickshop.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <MapPin className="w-5 h-5 text-gray-700 mt-1" />
              <div>
                <h3 className="font-medium">Address</h3>
                <p className="text-gray-600">
                  123 Commerce St, Suite 100
                  <br />
                  New York, NY 10001
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="font-medium mb-3">Business Hours</h3>
            <p className="text-gray-600">Monday - Friday: 9am - 6pm EST</p>
            <p className="text-gray-600">Saturday: 10am - 4pm EST</p>
            <p className="text-gray-600">Sunday: Closed</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-6">Send Us a Message</h2>

          {submitMessage && (
            <div
              className={`p-4 mb-6 rounded-md ${submitMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              {submitMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  <span>Send Message</span>
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
