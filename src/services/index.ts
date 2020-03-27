import { tokenListApi, exchangeApi, erc20Api, web3, theGraphApi } from 'api'

import {
  getTokenFromExchangeByAddressFactory,
  getTokenFromExchangeByIdFactory,
  addTokenToExchangeFactory,
  getPriceEstimationFactory,
} from './factories'
import { logDebug } from 'utils'
import { TokenDetails } from '@gnosis.pm/dex-js'

const apis = {
  tokenListApi,
  exchangeApi,
  erc20Api,
  web3,
  theGraphApi,
}

export const getTokenFromExchangeByAddress = getTokenFromExchangeByAddressFactory(apis)

export const getTokenFromExchangeById = getTokenFromExchangeByIdFactory(apis)

export const addTokenToExchangeContract = addTokenToExchangeFactory(apis)

export const getPriceEstimation = getPriceEstimationFactory(apis)

interface AddTokenToListParams {
  networkId: number
  tokenAddress: string
}
interface AddTokenToExchangeParams extends AddTokenToListParams {
  userAddress: string
}
interface AddTokenResult {
  success: boolean
  tokenList: TokenDetails[]
}

export const addTokenToList = async ({ networkId, tokenAddress }: AddTokenToListParams): Promise<AddTokenResult> => {
  const checkSumAddress = web3.utils.toChecksumAddress(tokenAddress)
  const token = await getTokenFromExchangeByAddress({ networkId, tokenAddress: checkSumAddress })
  if (token) {
    logDebug('Added new Token to userlist', token)

    tokenListApi.addToken({ token, networkId })
  } else {
    logDebug('Token at address', tokenAddress, 'not available in Exchange contract')
  }
  return {
    success: !!token,
    tokenList: tokenListApi.getTokens(networkId),
  }
}

export const addTokenToExchange = async ({
  userAddress,
  networkId,
  tokenAddress,
}: AddTokenToExchangeParams): Promise<AddTokenResult> => {
  const checkSumAddress = web3.utils.toChecksumAddress(tokenAddress)
  const token = await addTokenToExchangeContract({ userAddress, networkId, tokenAddress: checkSumAddress })
  if (token) {
    logDebug('Added new Token to userlist', token)

    tokenListApi.addToken({ token, networkId })
  } else {
    logDebug('Token at address', tokenAddress, 'could not be added to Exchange contract')
  }
  return {
    success: !!token,
    tokenList: tokenListApi.getTokens(networkId),
  }
}
