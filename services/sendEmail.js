import { randomBytes } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const ALLOWED_SEND_SCOPES = new Set([
    GMAIL_SEND_SCOPE,
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://mail.google.com/",
]);

const createGmailError = (message, code, status) => {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    error.safeToLog = true;
    return error;
};

const logGmailError = (error) => {
    console.error("Gmail API email send failed.", {
        message: error.safeToLog ? error.message : "Unexpected Gmail API error.",
        code: error.safeToLog ? error.code : "UNEXPECTED_ERROR",
        status: error.safeToLog ? error.status : null,
    });
};

const readJson = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const fetchGoogle = async (url, options, operation) => {
    try {
        return await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(15000),
        });
    } catch (error) {
        throw createGmailError(
            `Gmail ${operation} request failed due to a network error.`,
            error.code || "NETWORK_ERROR"
        );
    }
};

const getAccessToken = async () => {
    const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        throw createGmailError(
            "Gmail OAuth configuration is incomplete. Set CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN."
        );
    }

    const response = await fetchGoogle(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: "refresh_token",
        }),
    }, "OAuth token refresh");
    const result = await readJson(response);

    if (!response.ok || !result?.access_token) {
        const apiCode = typeof result?.error === "string" ? result.error : "";
        const code = /^[a-z0-9_]+$/i.test(apiCode)
            ? apiCode
            : "OAUTH_TOKEN_REFRESH_FAILED";
        const message = code === "invalid_grant"
            ? "Gmail refresh token is invalid or revoked. Reauthorize with Gmail send permission and update REFRESH_TOKEN."
            : `Gmail OAuth token refresh failed (HTTP ${response.status}, ${code}).`;
        throw createGmailError(message, code, response.status);
    }

    if (typeof result.scope === "string") {
        const grantedScopes = new Set(result.scope.split(/\s+/));
        if (![...ALLOWED_SEND_SCOPES].some((scope) => grantedScopes.has(scope))) {
            throw createGmailError(
                `Gmail OAuth token lacks send permission. Reauthorize with ${GMAIL_SEND_SCOPE} and update REFRESH_TOKEN.`,
                "GMAIL_SEND_SCOPE_MISSING"
            );
        }
    }

    return result.access_token;
};

const encodeMimeBody = (value) => {
    const encoded = Buffer.from(value, "utf8").toString("base64");
    return encoded.match(/.{1,76}/g)?.join("\r\n") || "";
};

const buildRawMessage = ({ to, subject, text, html }) => {
    const from = process.env.EMAIL_USER;
    if (!from || !to || /[\r\n]/.test(from) || /[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
        throw createGmailError("Gmail email headers or sender configuration are invalid.", "INVALID_EMAIL_HEADERS");
    }

    const headers = [
        `From: Gao-Connect <${from}>`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
        "MIME-Version: 1.0",
    ];

    if (!html) {
        headers.push("Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64");
        return `${headers.join("\r\n")}\r\n\r\n${encodeMimeBody(text)}`;
    }

    const boundary = `gao-connect-${randomBytes(12).toString("hex")}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    return [
        ...headers,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        encodeMimeBody(text),
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        encodeMimeBody(html),
        `--${boundary}--`,
        "",
    ].join("\r\n");
};

const sendGmailMessage = async ({ to, subject, text, html }) => {
    try {
        const accessToken = await getAccessToken();
        const raw = Buffer.from(
            buildRawMessage({ to, subject, text, html }),
            "utf8"
        ).toString("base64url");
        const response = await fetchGoogle(SEND_URL, {
            method: "POST",
            headers: {
                Authorization: ["Bearer", accessToken].join(" "),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw }),
        }, "message send");
        const result = await readJson(response);

        if (!response.ok) {
            const apiCode = result?.error?.errors?.[0]?.reason ||
                result?.error?.status ||
                "GMAIL_SEND_FAILED";
            const safeCode = typeof apiCode === "string" &&
                /^[a-z0-9_]+$/i.test(apiCode)
                ? apiCode
                : "GMAIL_SEND_FAILED";
            if (response.status === 403) {
                const missingScope = safeCode === "insufficientPermissions" ||
                    (result?.error?.status === "PERMISSION_DENIED" &&
                        /scope|insufficient/i.test(result?.error?.message || ""));
                throw createGmailError(
                    missingScope
                        ? `Gmail API denied sending. Reauthorize with ${GMAIL_SEND_SCOPE} and update REFRESH_TOKEN.`
                        : `Gmail API rejected sending (HTTP 403, ${safeCode}). Ensure the Gmail API is enabled and the token has ${GMAIL_SEND_SCOPE}.`,
                    safeCode,
                    response.status
                );
            }
            throw createGmailError(
                `Gmail API message send failed (HTTP ${response.status}, ${safeCode}).`,
                safeCode,
                response.status
            );
        }

        return { ...result, messageId: result.id };
    } catch (error) {
        logGmailError(error);
        throw error;
    }
};

export const sendEmail = async ({ to, subject, text }) =>
    sendGmailMessage({ to, subject, text });

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

        const info = await sendGmailMessage({
            to: userEmail,
            subject,
            text,
            html,
        });

        console.log("Welcome email sent:", info.messageId);
        return info;
    } catch (error) {
        throw error;
    }
};