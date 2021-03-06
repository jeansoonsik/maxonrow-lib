'use strict'

const { mxw, utils, nonFungibleToken } = require('mxw-sdk-js')
const { NonFungibleTokenActions } = nonFungibleToken
const bigNumberify = utils.bigNumberify
// const Utils = require('../src/utils/utils')

const indent = '     '

/**
 * Javascript Class to interact with Maxonrow Blockchain.
 */
module.exports = class LorenaMaxonrow {
  constructor (symbol, mnemonic, nodeProvider) {
    this.api = false
    this.keypair = {}
    this.units = 1000000000
    this.nodeProvider = {
      ...nodeProvider
    }
    this.symbol = symbol
    this.mnemonic = mnemonic

    this.defaultOverrides = {
      logSignaturePayload: (payload) => {
        if (!this.nodeProvider.trace.silentRpc) console.log(indent, 'signaturePayload:', JSON.stringify(payload))
      },
      logSignedTransaction: (signedTransaction) => {
        if (!this.nodeProvider.trace.silentRpc) console.log(indent, 'signedTransaction:', signedTransaction)
      }
    }
  }

  async connect () {
    return Promise.resolve().then(() => {
      this.providerConnection = new mxw.providers.JsonRpcProvider(this.nodeProvider.connection, this.nodeProvider)
      const silentRpc = this.nodeProvider.trace.silentRpc
      this.providerConnection
        .on('rpc', function (args) {
          if (!silentRpc) {
            if (args.action === 'response') {
              console.log(indent, 'RPC REQ:', JSON.stringify(args.request))
              console.log(indent, '    RES:', JSON.stringify(args.response))
            }
          }
        })
        .on('responseLog', function (args) {
          if (!silentRpc) {
            console.log(indent, 'RES LOG:', JSON.stringify({ info: args.info, response: args.response }))
          }
        })

      const silent = this.nodeProvider.trace.silent
      this.wallet = mxw.Wallet.fromMnemonic(this.mnemonic).connect(this.providerConnection)
      if (!silent) console.log(indent, 'Wallet:', JSON.stringify({ address: this.wallet.address, mnemonic: this.wallet.mnemonic }))

      this.provider = mxw.Wallet.fromMnemonic(this.nodeProvider.nonFungibleToken.provider).connect(this.providerConnection)
      if (!silent) console.log(indent, 'Provider:', JSON.stringify({ address: this.provider.address, mnemonic: this.provider.mnemonic }))

      this.issuer = mxw.Wallet.fromMnemonic(this.nodeProvider.nonFungibleToken.issuer).connect(this.providerConnection)
      if (!silent) console.log(indent, 'Issuer:', JSON.stringify({ address: this.issuer.address, mnemonic: this.issuer.mnemonic }))

      this.middleware = mxw.Wallet.fromMnemonic(this.nodeProvider.nonFungibleToken.middleware).connect(this.providerConnection)
      if (!silent) console.log(indent, 'Middleware:', JSON.stringify({ address: this.middleware.address, mnemonic: this.middleware.mnemonic }))

      if (!silent) console.log(indent, 'Fee collector:', JSON.stringify({ address: this.nodeProvider.nonFungibleToken.feeCollector }))
    }).catch(error => {
      console.log(error)
      throw error
    })
  }

  createKeyTokenItem (keyId, pubKey) {
    /**
     * Substrate Key:
     * Key {
     *  publicKey: ,
     *  diddoc_hash: ,
     *  valid_from: ,
     *  valid_to:
     * }
     */

    // Mutable data
    const metadata = {
      diddocHash: '',
      validTo: ''
    }

    // Immutable data
    const properties = {
      publicKey: pubKey,
      validFrom: Date.now().toString()
    }

    return {
      symbol: this.symbol,
      itemID: '#' + keyId,
      properties: JSON.stringify(properties), // immutable
      metadata: JSON.stringify(metadata)
    }
  }

  async createIdentityToken (did, pubKey) {
    // Convert did string to hashed did
    // const hashedDID = Utils.hashCode(did)

    // Convert pubKey to vec[u8]
    // const arr = Utils.toUTF8Array(pubKey)

    // console.log('Hasheddid:' + hashedDID + ' UTF8 pubkey arr:' + arr)

    // Mutable data
    const metadata = {
      key: '',
      did
    }

    // Immutable data
    const properties = {
    }

    this.nonFungibleTokenProperties = {
      name: 'Decentralised identifier ',
      symbol: this.symbol,
      fee: {
        to: this.nodeProvider.nonFungibleToken.feeCollector, // feeCollector wallet address
        value: bigNumberify('1')
      },
      properties: JSON.stringify(properties), // immutable
      metadata: JSON.stringify(metadata) // mutable
    }
    return nonFungibleToken
      .NonFungibleToken
      .create(
        this.nonFungibleTokenProperties,
        this.wallet, // This is the token owner wallet
        this.defaultOverrides
      )
      .then((token) => {
        if (token) {
          //* Approve
          const overrides = {
            tokenFees: [
              { action: NonFungibleTokenActions.transfer, feeName: 'default' }, // Should not be possible
              { action: NonFungibleTokenActions.transferOwnership, feeName: 'default' }, // Should not be possible
              { action: NonFungibleTokenActions.acceptOwnership, feeName: 'default' } // Should not be possible
            ],
            endorserList: [],
            mintLimit: 0,
            transferLimit: 0,
            burnable: false,
            transferable: false,
            modifiable: true,
            pub: true // not public
          }

          // For the approval process, we need 3 system wallets to sign the approval transaction.
          // Those 3 system wallets should keep in SECRET and AVOID EXPOSE to public
          // 1st signer: Provider wallet sign the approval transaction
          return nonFungibleToken.NonFungibleToken.approveNonFungibleToken(this.symbol, this.provider, overrides).then((transaction) => {
            // 2nd signer: Issuer wallet sign the approval transaction
            return nonFungibleToken.NonFungibleToken.signNonFungibleTokenStatusTransaction(transaction, this.issuer)
          }).then((transaction) => {
            // 3rd signer: Middleware wallet sign the approval transaction
            return nonFungibleToken.NonFungibleToken.sendNonFungibleTokenStatusTransaction(transaction, this.middleware)
          }).then(() => {
            // Refresh the token details from blockchain after approved
            return token.refresh().then(() => {
              // Keep this token object for later use, bear in mind the token only needed to create once and use for many times
              // To get back the approved token, call loadIdentityToken
              this.token = token
            })
          })
        }
      })
  }

  async registerDid (did, pubKey) {
    const key = this.createKeyTokenItem(did, pubKey)

    return nonFungibleToken.NonFungibleToken.fromSymbol(this.symbol, this.wallet).then((minterIdentity) => {
      // Mint to this wallet address
      return minterIdentity.mint(this.wallet.address, key).then((receipt) => {
        console.log(receipt) // do something
        return receipt
      })
    })
  }

  async getActualKey (did) {

  }

  async registerDidDocHash (did, diddocHash) {

  }

  async rotateKey (did, newPubKey) {

  }

  disconnect () {
    this.providerConnection.removeAllListeners()
  }
}
