import * as React from "react";

interface EmailTemplateProps {
  type: 'customer' | 'admin';
  firstName: string;
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderDetails: {
    orderId: string;
    amount: number;
    shippingMethod: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  type,
  firstName,
  shippingInfo,
  orderDetails,
}) => (
  <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
    <div style={{ background: "#f5f5f5", padding: "20px" }}>
      <h1 style={{ color: "#333", fontSize: "24px", margin: "0 0 20px 0" }}>
        {type === 'customer' ? 'Your Order Confirmation' : 'New Order Received'}
      </h1>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "4px" }}>
        <h2 style={{ color: "#666", fontSize: "18px", margin: "0 0 15px 0" }}>
          Order Details
        </h2>
        <p style={{ margin: "0 0 10px 0" }}>
          Order ID: {orderDetails.orderId}
        </p>
        <p style={{ margin: "0 0 10px 0" }}>
          Total Amount: ${orderDetails.amount.toFixed(2)}
        </p>
        <p style={{ margin: "0 0 10px 0" }}>
          Shipping Method: {orderDetails.shippingMethod}
        </p>

        <h3 style={{ color: "#666", fontSize: "16px", margin: "20px 0 10px 0" }}>
          Items Ordered
        </h3>
        <div style={{ border: "1px solid #eee", padding: "10px", borderRadius: "4px" }}>
          {orderDetails.items.map((item, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <p style={{ margin: "0" }}>
                {item.name} × {item.quantity}
              </p>
              <p style={{ margin: "0", color: "#666" }}>
                ${item.price.toFixed(2)} each
              </p>
            </div>
          ))}
        </div>

        <h3 style={{ color: "#666", fontSize: "16px", margin: "20px 0 10px 0" }}>
          Shipping Information
        </h3>
        <div style={{ border: "1px solid #eee", padding: "10px", borderRadius: "4px" }}>
          <p style={{ margin: "0 0 5px 0" }}>
            {shippingInfo.firstName} {shippingInfo.lastName}
          </p>
          <p style={{ margin: "0 0 5px 0" }}>
            {shippingInfo.address}
            {shippingInfo.apartment && `, ${shippingInfo.apartment}`}
          </p>
          <p style={{ margin: "0 0 5px 0" }}>
            {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
          </p>
          <p style={{ margin: "0 0 5px 0" }}>
            {shippingInfo.country}
          </p>
          <p style={{ margin: "0 0 5px 0" }}>
            Phone: {shippingInfo.phone}
          </p>
          <p style={{ margin: "0" }}>
            Email: {shippingInfo.email}
          </p>
        </div>

        {type === 'customer' && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "#666" }}>
              Thank you for your order! We will notify you when your items ship.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default EmailTemplate;
