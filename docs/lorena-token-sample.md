# Token sample

```javascript
async createLorenaDidToken() {
    // Immutable data
    const properties = {
      did
      // ToDo
      // keyIndex: keyId
    }

    this.nonFungibleTokenProperties = {
      name: 'Decentralised identifier ',
      symbol: 'LORDID', // pongo identity por que el DDID ya lo han creado ellos.... (además tendremos que añadirlo)
      fee: {
        to: this.nodeProvider.nonFungibleToken.feeCollector, // feeCollector wallet address
        value: bigNumberify('1')
      },
      properties: JSON.stringify(properties), // immutable
      metadata: ''//JSON.stringify(metadata) // mutable
    }
    return nonFungibleToken
      .NonFungibleToken
      .create(
        this.nonFungibleTokenProperties,
        this.issuer, // this.nodeProvider.nonFungibleToken.issuer,
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
            mintLimit: false,
            transferLimit: 0,
            burnable: false,
            transferable: false,
            modifiable: true,
            pub: true // not public
          }
          return performNonFungibleTokenStatus(
            this.nonFungibleTokenProperties.symbol,
            token.NonFungibleToken.approveNonFungibleToken,
            overrides
          )
            .then((receipt) => {
              console.log(receipt) // do something
            })
        }
      })
  }
```