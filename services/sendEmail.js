import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

export const sendEmail = async ({ to, subject, text }) => {
    return transporter.sendMail({
        from: `"Gao-Connect" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    });
};

const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);

export const sendRegistrationEmail = async (userEmail, name) => {
    try {
        const subject = "Welcome to Gao-Connect!";
        const escapedName = escapeHtml(name);

        const text = `Hello ${name},

Welcome to Gao-Connect!

Your registration has been completed successfully.

Thank you for joining our community!

Team Gao-Connect`;

        const html = `
            <h2>Hello ${escapedName},</h2>
            <p>Welcome to <b>Gao-Connect!</b></p>
            <p>Your registration has been completed successfully.</p>
            <p>Thank you for joining our community!</p>
            <p>Team Gao-Connect</p>
        `;

        const info = await transporter.sendMail({
            from: `"Gao-Connect" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject,
            text,
            html,
        });

        console.log("Welcome email sent:", info.messageId);

        return info;

    } catch (error) {
        console.error("Welcome email error:", error.message);
        throw error;
    }
};