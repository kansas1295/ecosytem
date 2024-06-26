import type { ClientWithAlchemyMethods } from '@alchemy/aa-alchemy'
import type { Address } from 'viem'

import { JsonRpcCastableError } from '@/errors/JsonRpcCastableError'
import type { MonitoringCtx } from '@/monitoring/MonitoringCtx'
import { alchemySponsorUserOperation } from '@/paymasterProvider/alchemy/alchemySponsorUserOperation'
import type { UserOperation } from '@/schemas/userOperationSchema'

export const handleAlchemySponsorUserOperation = async (
  { logger, metrics, defaultMetricLabels }: MonitoringCtx,
  {
    alchemyClient,
    alchemyPolicyId,
    userOperation,
    entryPoint,
  }: {
    alchemyClient: ClientWithAlchemyMethods
    alchemyPolicyId: string
    userOperation: UserOperation
    entryPoint: Address
  },
) => {
  // proxy request to the provider
  try {
    const result = await alchemySponsorUserOperation(
      alchemyClient,
      alchemyPolicyId,
      userOperation,
      entryPoint,
    )

    metrics.paymasterCallSuccesses.inc(defaultMetricLabels)
    return result
  } catch (e) {
    logger.error(e, 'Alchemy paymaster provider RPC error')
    if (e instanceof JsonRpcCastableError) {
      metrics.paymasterCallRpcFailures.inc({
        ...defaultMetricLabels,
        jsonRpcCode: e.jsonRpcErrorCode,
      })
    } else {
      metrics.paymasterCallNonRpcFailures.inc(defaultMetricLabels)
    }
    throw e
  }
}
