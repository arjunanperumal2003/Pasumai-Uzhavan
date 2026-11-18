import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("ORDER EMAIL DATA:", body);

    const {
      name,
      email,
      products,
      total,
      payment,
      address,
    } = body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!email) {
      return Response.json(
        {
          success: false,
          error: "Customer email is missing",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // GMAIL SMTP
    // =====================================================

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",

      port: 587,

      secure: false,

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // =====================================================
    // EMAIL
    // =====================================================

    const mailOptions = {
      from: process.env.EMAIL_USER,

      to: email,

      subject: "Order Confirmed - Pasumai Uzhavan",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
          "
        >

          <h2>
            🌱 Order Confirmed - Pasumai Uzhavan
          </h2>

          <p>
            Hello <b>${name || "Customer"}</b>,
          </p>

          <p>
            Your order has been placed successfully.
          </p>

          <hr />

          <h3>Order Details</h3>

          <p>
            <b>Products:</b>
          </p>

          <p>
            ${products || "No products"}
          </p>

          <p>
            <b>Total:</b>
            ₹${total || "0.00"}
          </p>

          <p>
            <b>Payment:</b>
            ${payment || "Not specified"}
          </p>

          <p>
            <b>Delivery Address:</b>
            ${address || "Not provided"}
          </p>

          <hr />

          <p>
            Thank you for shopping with
            <b>Pasumai Uzhavan</b> 🌱
          </p>

        </div>
      `,
    };

    // =====================================================
    // SEND EMAIL
    // =====================================================

    const info =
      await transporter.sendMail(mailOptions);

    console.log(
      "ORDER MAIL SENT:",
      info.response
    );

    return Response.json({
      success: true,
      message: "Order confirmation email sent",
    });

  } catch (error) {

    console.error(
      "ORDER MAIL ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error.message ||
          "Mail sending failed",
      },
      {
        status: 500,
      }
    );
  }
}