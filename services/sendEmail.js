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

const redactDiagnosticValue = (value) => {
    if (value == null) return null;

    let sanitized = String(value).replace(/\b\d{6}\b/g, "[redacted]");
    for (const secret of [
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REFRESH_TOKEN,
        process.env.EMAIL_USER,
    ]) {
        if (secret) sanitized = sanitized.replaceAll(secret, () => "[redacted]");
    }

    return sanitized;
};

const logSmtpError = (context, error) => {
    console.error(context, {
        message: redactDiagnosticValue(error?.message),
        code: redactDiagnosticValue(error?.code),
        command: redactDiagnosticValue(error?.command),
        response: redactDiagnosticValue(error?.response),
    });
};

const diagnoseSmtpFailure = async (context, error) => {
    logSmtpError(context, error);

    try {
        await transporter.verify();
        console.error("SMTP connection check succeeded after email failure.");
    } catch (connectionError) {
        logSmtpError("SMTP connection check failed.", connectionError);
    }
};

export const sendEmail = async ({ to, subject, text }) => {
    try {
        return await transporter.sendMail({
            from: `"Gao-Connect" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
    } catch (error) {
        await diagnoseSmtpFailure("Email send failed.", error);
        throw error;
    }
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
        await diagnoseSmtpFailure("Welcome email send failed.", error);
        throw error;
    }
};