import Joi, { Schema } from "joi"
import {
	LoginData,
	PasswordResetRequestData,
	RefreshTokenData,
	RegistrationData,
	ResetPasswordData,
	TwoFactorCodeData,
	VerificationTokenData,
} from "../types/types"

export const validateRegistration = (data: RegistrationData) => {
	const schema = Joi.object({
		firstName: Joi.string().min(3).max(30).required(),
		lastName: Joi.string().min(3).max(30).optional(),
		email: Joi.string().email().required(),
		password: Joi.string().min(6).required(),
	})

	return schema.validate(data)
}

export const validateLogin = (data: LoginData) => {
	const schema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().min(6).required(),
	})

	return schema.validate(data)
}

export const validateForgotPasswordRequest = (data: PasswordResetRequestData) => {
	const schema = Joi.object({
		email: Joi.string().email().required(),
	})

	return schema.validate(data)
}

export const validateResetPassword = (data: ResetPasswordData) => {
	const schema = Joi.object({
		newPassword: Joi.string().min(6).required(),
	})

	return schema.validate(data)
}

export const validateTwoFactorCode = (data: TwoFactorCodeData) => {
	const schema = Joi.object({
		code: Joi.string().length(6).required(),
	})

	return schema.validate(data)
}

export const validateRefreshToken = (data: RefreshTokenData) => {
	const schema = Joi.object({
		token: Joi.string().required(),
	})

	return schema.validate(data)
}

export const validateVerificationToken = (data: VerificationTokenData) => {
	const schema = Joi.object({
		token: Joi.string().required(),
	})

	return schema.validate(data)
}
