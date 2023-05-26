import { type ForgetCodeAuthentication } from '@/domain/use-cases'
import { type TokenGenerator, type HashComparer, type LoadGuardianByEmailRepository, type HashGenerator } from '@/data/protocols'
import { NotFoundError } from '@/application/errors'
import { InvalidForgetCodeError } from '@/application/errors/invalid-forget-code-error'

export class DbForgetCodeAuthentication implements ForgetCodeAuthentication {
  private readonly loadGuardianByEmailRepository: LoadGuardianByEmailRepository
  private readonly hashComparer: HashComparer
  private readonly tokenGenerator: TokenGenerator
  private readonly hashGenerator: HashGenerator

  constructor ({
    loadGuardianByEmailRepository,
    hashComparer,
    tokenGenerator,
    hashGenerator
  }: ForgetCodeAuthentication.Dependencies) {
    this.loadGuardianByEmailRepository = loadGuardianByEmailRepository
    this.hashComparer = hashComparer
    this.tokenGenerator = tokenGenerator
    this.hashGenerator = hashGenerator
  }

  async auth (input: ForgetCodeAuthentication.Params): Promise<ForgetCodeAuthentication.Result> {
    const guardian = await this.loadGuardianByEmailRepository.loadByEmail(input.email)
    if (!guardian) {
      return new NotFoundError('email')
    }
    const isValid = await this.hashComparer.compare({ value: input.forgetPasswordCode, hash: guardian.forgetPasswordToken ?? '' })
    if (!isValid) {
      return new InvalidForgetCodeError()
    }
    const accessToken = await this.tokenGenerator.generate({ sub: guardian.id })
    await this.hashGenerator.encrypt({ value: accessToken })
  }
}
