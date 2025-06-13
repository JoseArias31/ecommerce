import React from 'react';

interface EmailTemplateProps {
  type: 'customer' | 'admin';
  firstName: string;
  translations: {
    yourItems: string;
    totalAmount: string;
    shippingInfo: string;
    shippingMethod: string;
    quantity: string;
    orderShipNotification: string;
    viewInDashboard: string;
    allRightsReserved: string;
  };
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
      image: string;
    }>;
  };
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  type,
  firstName,
  shippingInfo,
  orderDetails,
  translations,
}) => (
  <div style={{
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    color: "#333333",
    lineHeight: 1.5,
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden"
  }}>
    {/* Header */}
    <div style={{
      padding: "30px 20px",
      background: "linear-gradient(135deg, #3B82F6 0%, #1D4ed8 100%)",
      color: "white",
      textAlign: "center"
    }}>
      <img 
        src="https://thequickshop.com/logo-white.png" 
        alt="The Quick Shop Logo" 
        style={{ 
          height: "32px",
          marginBottom: "20px",
          width: "auto" 
        }}
      />
      <h1 style={{
        fontSize: "24px",
        fontWeight: 600,
        margin: "0",
        letterSpacing: "0.5px"
      }}>
        {type === 'customer' 
          ? `Thanks for your order, ${firstName}!` 
          : '🛍️ New Order Alert'}
      </h1>
    </div>
    
    {/* Order Summary */}
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px",
      background: "#f9fafb",
      borderBottom: "1px solid #e5e7eb"
    }}>
      <div style={{ minWidth: "45%" }}>
        <p style={{
          fontSize: "12px",
          color: "#6b7280",
          margin: "0 0 5px 0",
          letterSpacing: "0.5px"
        }}>
          ORDER NUMBER
        </p>
        <p style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#111827",
          margin: "0",
          wordBreak: "break-word"
        }}>
          #{orderDetails.orderId.replace('#', '')}
        </p>
      </div>
      <div style={{ minWidth: "45%", textAlign: "right" }}>
        <p style={{
          fontSize: "12px",
          color: "#6b7280",
          margin: "0 0 5px 0",
          letterSpacing: "0.5px"
        }}>
          {translations.totalAmount}
        </p>
        <p style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#111827",
          margin: "0"
        }}>
          ${orderDetails.amount}
        </p>
      </div>
    </div>

    {/* Items List - Professionally Styled */}
    <div style={{ padding: "0 20px", margin: "20px 0" }}>
      <h3 style={{
        fontSize: "14px",
        fontWeight: 600,
        color: "#6b7280",
        margin: "0 0 15px 0",
        letterSpacing: "0.5px",
        textTransform: "uppercase"
      }}>
        {translations.yourItems}
      </h3>
      
      {orderDetails.items.map((item, index) => (
        <div key={index} style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderBottom: index < orderDetails.items.length - 1 
            ? "1px solid #f3f4f6" 
            : "none",
          gap: "15px"
        }}>
          {/* Product Info */}
          <div style={{ flex: 1, display: "flex", gap: "16px", alignItems: "center" }}>
            {/* <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img 
                src={item.image} 
                alt={item.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
            </div> */}
            <div>
              <p style={{
                margin: "0 0 4px 0",
                fontSize: "15px",
                fontWeight: 500,
                color: "#111827",
                lineHeight: 1.4
              }}>
                {item.name}
              </p>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#4b5563"
                  }}>
                    {item.quantity}
                  </span>
                </div>
                <span style={{
                  fontSize: "13px",
                  color: "#6b7280"
                }}>
                  {translations.quantity}
                </span>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div style={{
            textAlign: "right",
            minWidth: "80px"
          }}>
            <p style={{
              margin: "0 0 4px 0",
              fontSize: "15px",
              fontWeight: 500,
              color: "#111827"
            }}>
              ${item.price}
            </p>
            <p style={{
              margin: "0",
              fontSize: "13px",
              color: "#6b7280",
              fontWeight: 500
            }}>
              ${(item.price * item.quantity)}
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* Shipping Information */}
    <div style={{
      padding: "20px",
      background: "#f9fafb",
      margin: "20px",
      borderRadius: "8px"
    }}>
      <h3 style={{
        fontSize: "14px",
        fontWeight: 600,
        color: "#6b7280",
        margin: "0 0 15px 0",
        letterSpacing: "0.5px",
        textTransform: "uppercase"
      }}>
        {translations.shippingInfo}
      </h3>
      <div style={{ lineHeight: "1.6" }}>
        <p style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#111827" }}>
          <strong>{shippingInfo.firstName} {shippingInfo.lastName}</strong>
        </p>
        <p style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#111827" }}>
          {shippingInfo.address}
          {shippingInfo.apartment && `, ${shippingInfo.apartment}`}
        </p>
        <p style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#111827" }}>
          {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
        </p>
        <p style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#111827" }}>
          {shippingInfo.country}
        </p>
        <p style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#111827" }}>
          📱 {shippingInfo.phone}
        </p>
        <p style={{ margin: "0", fontSize: "15px", color: "#111827" }}>
          ✉️ {shippingInfo.email}
        </p>
      </div>
    </div>

    {/* Shipping Method */}
    <div style={{
      padding: "20px",
      background: "#f9fafb",
      margin: "0 20px 20px 20px",
      borderRadius: "8px"
    }}>
      <h3 style={{
        fontSize: "14px",
        fontWeight: 600,
        color: "#6b7280",
        margin: "0 0 15px 0",
        letterSpacing: "0.5px",
        textTransform: "uppercase"
      }}>
        {translations.shippingMethod}
      </h3>
      <p style={{
        margin: "0",
        fontSize: "15px",
        color: "#111827",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        🚚 {orderDetails.shippingMethod}
      </p>
      {type === 'customer' && (
        <p style={{
          fontSize: "13px",
          color: "#6b7280",
          margin: "12px 0 0 0",
          fontStyle: "italic"
        }}>
          {translations.orderShipNotification}
        </p>
      )}
    </div>

    {/* Footer */}
    <div style={{
      padding: "20px",
      textAlign: "center",
      background: "#f9fafb",
      borderTop: "1px solid #e5e7eb"
    }}>
      {type === 'customer' ? (
        <>
          <p style={{
            fontSize: "14px",
            color: "#6b7280",
            margin: "0 0 16px 0"
          }}>
            Need help? Reply to this email or contact us at <a 
              href="mailto:support@thequickshop.com" 
              style={{
                color: "#3B82F6", 
                textDecoration: "none",
                fontWeight: 500
              }}>
              support@thequickshop.com
            </a>
          </p>
          <p style={{
            fontSize: "12px",
            color: "#9ca3af",
            margin: "16px 0 0 0"
          }}>
            © {new Date().getFullYear()} The Quick Shop. {translations.allRightsReserved}
          </p>
        </>
      ) : (
        <p style={{
          fontSize: "14px",
          color: "#6b7280",
          margin: "0"
        }}>
          This order requires processing. <a 
            href={`https://admin.thequickshop.com/orders/${orderDetails.orderId}`} 
            style={{
              color: "#3B82F6", 
              fontWeight: 500, 
              textDecoration: "none"
            }}>
            {translations.viewInDashboard}
          </a>
        </p>
      )}
    </div>
  </div>
);

export default EmailTemplate;