
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("CONTACT DATA:", body);

    const {
      name,
      email,
      phone,
      subject,
      message,
    } = body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      return Response.json(
        {
          success: false,
          error: "Required fields are missing",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // GMAIL SMTP
    // =====================================================

    const transporter =
      nodemailer.createTransport({
        host: "smtp.gmail.com",

        port: 587,

        secure: false,

        auth: {
          user:
            process.env.EMAIL_USER,

          pass:
            process.env.EMAIL_PASS,
        },
      });

    // =====================================================
    // SEND EMAIL TO ADMIN
    // =====================================================

    const mailOptions = {
      from:
        process.env.EMAIL_USER,

      to:
        process.env.EMAIL_USER,

      replyTo:
        email,

      subject:
        `New Contact Message: ${subject}`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">

          <h2>New Contact Message - Pasumai Uzhavan</h2>

          <hr />

          <p>
            <b>Name:</b>
            ${name}
          </p>

          <p>
            <b>Email:</b>
            ${email}
          </p>

          <p>
            <b>Phone:</b>
            ${phone || "Not provided"}
          </p>

          <p>
            <b>Subject:</b>
            ${subject}
          </p>

          <p>
            <b>Message:</b>
          </p>

          <p>
            ${message}
          </p>

        </div>
      `,
    };

    // =====================================================
    // SEND
    // =====================================================

    const info =
      await transporter.sendMail(
        mailOptions
      );

    console.log(
      "MAIL SENT:",
      info.response
    );

    return Response.json({
      success: true,
      message:
        "Message sent successfully",
    });

  } catch (error) {

    console.error(
      "MAIL ERROR:",
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

