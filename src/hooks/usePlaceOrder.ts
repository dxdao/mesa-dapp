import { useCallback } from 'react'
import BN from 'bn.js'
import { toast } from 'react-toastify'

import { TokenDetails, PlaceOrderParams as ExchangeApiPlaceOrderParams } from 'types'
import { exchangeApi } from 'api'
import { log } from 'utils'
import { txOptionalParams } from 'utils/transaction'
import { useWalletConnection } from './useWalletConnection'
import { DEFAULT_ORDER_DURATION } from 'const'
import useSafeState from './useSafeState'

interface PlaceOrderParams {
  buyAmount: BN
  buyToken: TokenDetails
  sellAmount: BN
  sellToken: TokenDetails
}

interface Result {
  placeOrder: (params: PlaceOrderParams) => Promise<boolean>
  isSubmitting: boolean
}

export const usePlaceOrder = (): Result => {
  const [isSubmitting, setIsSubmitting] = useSafeState(false)
  const { userAddress } = useWalletConnection()

  const placeOrder = useCallback(
    async ({ buyAmount, buyToken, sellAmount, sellToken }: PlaceOrderParams): Promise<boolean> => {
      if (!userAddress) {
        toast.error('Wallet is not connected!')
        return false
      }

      setIsSubmitting(true)
      log(
        `Placing order: buy ${buyAmount.toString()} ${buyToken.symbol} sell ${sellAmount.toString()} ${
          sellToken.symbol
        }`,
      )

      try {
        const [sellTokenId, buyTokenId, batchId] = await Promise.all([
          exchangeApi.getTokenIdByAddress(sellToken.address),
          exchangeApi.getTokenIdByAddress(buyToken.address),
          exchangeApi.getCurrentBatchId(),
        ])

        const validUntil = batchId + DEFAULT_ORDER_DURATION

        const params: ExchangeApiPlaceOrderParams = {
          userAddress,
          buyTokenId,
          sellTokenId,
          validUntil,
          buyAmount,
          sellAmount,
        }
        const receipt = await exchangeApi.placeOrder(params, txOptionalParams)
        log(`The transaction has been mined: ${receipt.transactionHash}`)

        // TODO: get order id in a separate call
        // toast.success(`Placed order id=${receipt.data} valid for 30min`)

        return true
      } catch (e) {
        log(`Error placing order`, e)
        toast.error(`Error placing order: ${e.message}`)

        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [setIsSubmitting, userAddress],
  )

  return { placeOrder, isSubmitting }
}