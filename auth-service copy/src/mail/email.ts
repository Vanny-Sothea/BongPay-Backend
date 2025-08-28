import logger from "../utils/logger"
import {
	PASSWORD_RESET_REQUEST_TEMPLATE,
	PASSWORD_RESET_SUCCESS_TEMPLATE,
	VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates"
import { transporter, sender } from "./mailConfig"


if (!process.env.MAIL_AUTH_USER) throw new Error("MAIL_AUTH_USER not set")

// const company_name = process.env.COMPANY_NAME || "BongPay"

export const sendVerificationEmail = async (
	email: string,
	verificationCode: string
) => {
	const recipient = email
    
	try {
		const response = await transporter.sendMail({
			from: sender,
			to: recipient,
			subject: "Verify Your Email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace(
				"{verificationCode}",
				verificationCode
			),
		})
		logger.info("Verification email sent successfully", response)
	} catch (error) {
		logger.error("Error sending verification email", error)
		throw new Error(`Error sending verification email: ${error}`)
	}
}

export const sendPasswordResetEmail = async (email:string, verificationCode: string) => {
    const recipient = email;

    try {
        const response = await transporter.sendMail({
            from : sender,
            to : recipient,
            subject : 'Reset Your Password',
            html : PASSWORD_RESET_REQUEST_TEMPLATE.replace('{verificationCode}', verificationCode),
        });

        logger.info('Password reset email sent successfully', response);
    } catch (error) {
        logger.error('Error sending password reset email', error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
}

export const sendResetSuccessEmail = async (email:string) => {
    const recipient = email;

    try {
        const response = await transporter.sendMail({
            from : sender,
            to : recipient,
            subject : 'Password Reset Successful',
            html : PASSWORD_RESET_SUCCESS_TEMPLATE,
        });

        logger.info('Sent password reset successfully message successfully', response);
    } catch (error) {
        logger.error('Error sending password reset email', error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
}