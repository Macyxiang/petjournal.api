import { ForgetPasswordController } from '@/application/controllers/forget-password'
import { type EmailValidator } from '@/application/validation/protocols'
import { type TokenGenerator } from '@/data/protocols/cryptography'
import { type ForgetPassword, type EmailService } from '@/domain/use-cases'
import { makeEmailValidator, makeFakeGuardianWithIdData, makeFakeServerError, makeLoadGuardianByEmail, makeTokenGenerator } from '@/tests/utils'
import { type LoadGuardianByEmailRepository } from '@/data/protocols'
import { NotFoundError } from '@/application/errors'
import { badRequest, success, type HttpRequest } from '@/application/helpers/http'

const makeEmailService = (): EmailService => {
  class EmailServiceStub implements EmailService {
    async send (options: EmailService.Options): Promise<boolean> {
      return await new Promise(resolve => { resolve(true) })
    }
  }
  return new EmailServiceStub()
}

const makeForgetPassword = (): ForgetPassword => {
  class ForgetPasswordStub implements ForgetPassword {
    async forgetPassword (email: ForgetPassword.Params): Promise<ForgetPassword.Result> {
      return await new Promise(resolve => { resolve(true) })
    }
  }
  return new ForgetPasswordStub()
}

const makeFakeRequest = (): HttpRequest => {
  return {
    body: {
      email: 'any_email@mail.com'
    }
  }
}

interface SutTypes {
  sut: ForgetPasswordController
  emailValidatorStub: EmailValidator
  loadGuardianByEmailStub: LoadGuardianByEmailRepository
  tokenGeneratorStub: TokenGenerator
  emailServiceStub: EmailService
  forgetPasswordStub: ForgetPassword
}

const makeSut = (): SutTypes => {
  const emailValidatorStub = makeEmailValidator()
  const loadGuardianByEmailStub = makeLoadGuardianByEmail(makeFakeGuardianWithIdData())
  const tokenGeneratorStub = makeTokenGenerator()
  const emailServiceStub = makeEmailService()
  const forgetPasswordStub = makeForgetPassword()
  const dependencies: ForgetPasswordController.Dependencies = {
    emailValidator: emailValidatorStub,
    forgetPassword: forgetPasswordStub
  }
  const sut = new ForgetPasswordController(dependencies)
  return {
    sut,
    emailValidatorStub,
    loadGuardianByEmailStub,
    tokenGeneratorStub,
    emailServiceStub,
    forgetPasswordStub
  }
}

describe('ForgetPassword Controller', () => {
  it('Should return 400 if no email is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {}
    }

    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
  })

  it('Should return 400 if an invalid email is provided', async () => {
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false)
    const httpResponse = await sut.handle(makeFakeRequest())
    expect(httpResponse.statusCode).toBe(400)
  })

  it('Should call EmailValidator with correct email', async () => {
    const { sut, emailValidatorStub } = makeSut()
    const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid')
    const httpRequest = {
      body: {
        email: 'valid_email@mail.com'
      }
    }
    await sut.handle(httpRequest)
    expect(isValidSpy).toHaveBeenCalledWith('valid_email@mail.com')
  })

  it('Should return 500 if EmailValidator throws', async () => {
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
      throw new Error()
    })
    const httpResponse = await sut.handle(makeFakeRequest())
    expect(httpResponse).toEqual(makeFakeServerError())
  })

  it('Should return 400 if no guardian is found with the provided email', async () => {
    const { sut, forgetPasswordStub } = makeSut()
    jest.spyOn(forgetPasswordStub, 'forgetPassword').mockReturnValueOnce(new Promise(resolve => { resolve(false) }))
    const httpResponse = await sut.handle(makeFakeRequest())
    expect(httpResponse).toEqual(badRequest(new NotFoundError('email')))
  })

  it('Should return 200 if an valid email is provided', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle(makeFakeRequest())
    expect(httpResponse).toEqual(success({ message: 'Email sent successfully' }))
  })
})
