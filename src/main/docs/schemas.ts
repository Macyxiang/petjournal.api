import {
  accessTokenSchema,
  changePasswordParamsSchema,
  errorSchema,
  forgetPasswordSchema,
  guardianSchema,
  loginParamsSchema,
  signUpParamsSchema,
  waitingCodeParamsSchema
} from '@/main/docs/schemas/'

export default {
  error: errorSchema,
  accessToken: accessTokenSchema,
  guardian: guardianSchema,
  loginParams: loginParamsSchema,
  signUpParams: signUpParamsSchema,
  forgetPasswordParams: forgetPasswordSchema,
  changePasswordParams: changePasswordParamsSchema,
  waitingCodeParams: waitingCodeParamsSchema
}
