import { type AddGuardianRepository, type HashGenerator } from '@/data/protocols'
import { type AddGuardian } from '@/domain/use-cases'

export class DbAddGuardian implements AddGuardian {
  private readonly guardianRepository: AddGuardianRepository
  private readonly hashService: HashGenerator

  constructor (guardianRepository: AddGuardianRepository, hashService: HashGenerator) {
    this.guardianRepository = guardianRepository
    this.hashService = hashService
  }

  async add (guardianData: AddGuardian.Params): Promise<AddGuardian.Result> {
    const hashedPassword = await this.hashService.encrypt({ value: guardianData.password })
    return await this.guardianRepository.add(Object.assign({}, guardianData, { password: hashedPassword }))
  }
}
