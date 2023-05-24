import { WaitingCodeController } from '@/application/controllers/waiting-code'
import { InvalidParamError, MissingParamError } from '@/application/errors'
import { type HttpRequest, badRequest, success, unauthorized } from '@/application/helpers/http'
import { type EmailValidator } from '@/application/validation/protocols'
import { type ForgetCodeAuthentication } from '@/domain/use-cases'
import { makeEmailValidator, makeFakeServerError, makeForgetCodeAuthentication } from '@/tests/utils'

interface SutTypes {
  sut: WaitingCodeController
  emailValidatorStub: EmailValidator
  forgetCodeAuthenticationStub: ForgetCodeAuthentication
}

const makeSut = (): SutTypes => {
  const emailValidatorStub = makeEmailValidator()
  const forgetCodeAuthenticationStub = makeForgetCodeAuthentication()
  const sut = new WaitingCodeController(emailValidatorStub, forgetCodeAuthenticationStub)
  return {
    sut,
    emailValidatorStub,
    forgetCodeAuthenticationStub
  }
}

const makeFakeWaitingCodeRequest = (): HttpRequest => ({
  body: {
    email: 'valid_email',
    forgetPasswordCode: 'valid_code'
  }
})

describe('WaitingCode Controller', () => {
  describe('tests the email field', () => {
    it('should return bad request if no email is provided', async () => {
      const { sut } = makeSut()
      const httpRequest = {
        body: {}
      }

      const httpResponse = await sut.handle(httpRequest)

      expect(httpResponse).toEqual(badRequest(new MissingParamError('email')))
    })

    it('should return bad request if invalid email is provided', async () => {
      const { sut, emailValidatorStub } = makeSut()
      const httpRequest = {
        body: {
          email: 'invalid_email',
          forgetPasswordCode: 'valid_code'
        }
      }
      jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false)

      const httpResponse = await sut.handle(httpRequest)

      expect(httpResponse).toEqual(badRequest(new InvalidParamError('email')))
    })

    it('should call EmailValidator with correct email', async () => {
      const { sut, emailValidatorStub } = makeSut()
      const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false)

      await sut.handle(makeFakeWaitingCodeRequest())

      expect(isValidSpy).toHaveBeenCalledWith(makeFakeWaitingCodeRequest().body.email)
    })

    it('should throws if EmailValidator throws', async () => {
      const { sut, emailValidatorStub } = makeSut()
      jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => { throw new Error() })

      const httpResponse = await sut.handle(makeFakeWaitingCodeRequest())

      expect(httpResponse).toEqual(makeFakeServerError())
    })
  })

  describe('tests the forgetPasswordCode field', () => {
    it('should return bad request if no forgetPasswordCode is provided', async () => {
      const { sut } = makeSut()
      const httpRequest = {
        body: {
          email: 'valid_email'
        }
      }

      const httpResponse = await sut.handle(httpRequest)

      expect(httpResponse).toEqual(badRequest(new MissingParamError('forgetPasswordCode')))
    })

    it('should return unauthorized if invalid forgetPasswordCode is provided', async () => {
      const { sut, forgetCodeAuthenticationStub } = makeSut()
      const httpRequest = {
        body: {
          email: 'valid_email',
          forgetPasswordCode: 'invalid_code'
        }
      }
      jest.spyOn(forgetCodeAuthenticationStub, 'auth').mockResolvedValueOnce(false)

      const httpResponse = await sut.handle(httpRequest)

      expect(httpResponse).toEqual(unauthorized())
    })

    it('should call ForgetCodeAuthentication with correct values', async () => {
      const { sut, forgetCodeAuthenticationStub } = makeSut()
      const httpRequest = {
        body: {
          email: 'valid_email',
          forgetPasswordCode: 'invalid_code'
        }
      }
      const codeAuthSpy = jest.spyOn(forgetCodeAuthenticationStub, 'auth').mockResolvedValueOnce(false)

      await sut.handle(httpRequest)

      expect(codeAuthSpy).toHaveBeenCalledWith({
        email: httpRequest.body.email,
        forgetPasswordCode: httpRequest.body.forgetPasswordCode
      })
    })

    it('should throws if ForgetCodeAuthentication throws', async () => {
      const { sut, forgetCodeAuthenticationStub } = makeSut()
      jest.spyOn(forgetCodeAuthenticationStub, 'auth').mockImplementationOnce(() => { throw new Error() })

      const httpResponse = await sut.handle(makeFakeWaitingCodeRequest())

      expect(httpResponse).toEqual(makeFakeServerError())
    })
  })

  describe('test success case', () => {
    it('should return success if valid input is provided', async () => {
      const { sut } = makeSut()

      const httpResponse = await sut.handle(makeFakeWaitingCodeRequest())

      expect(httpResponse).toEqual(success({ message: 'Success, valid forget password code provided' }))
    })
  })
})
