/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/zk_escrow.json`.
 */
export type ZkEscrow = {
  "address": "8dDBL1hy8229irhfS6DGhHfV3wtdsxCYnL4dYVJURG65",
  "metadata": {
    "name": "zkEscrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "ZK QR Cash Escrow Program with PDA Vault"
  },
  "instructions": [
    {
      "name": "claimGift",
      "discriminator": [
        100,
        71,
        251,
        14,
        225,
        15,
        243,
        196
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow_state.gift_id",
                "account": "escrowState"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow_state.gift_id",
                "account": "escrowState"
              }
            ]
          },
          "relations": [
            "escrowState"
          ]
        },
        {
          "name": "recipient",
          "writable": true,
          "signer": true
        },
        {
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "initializeGift",
      "discriminator": [
        27,
        106,
        118,
        72,
        118,
        149,
        101,
        149
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "giftId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "giftId"
              }
            ]
          }
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "giftId",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "pubkey"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "refundGift",
      "discriminator": [
        55,
        32,
        33,
        189,
        203,
        108,
        48,
        9
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow_state.gift_id",
                "account": "escrowState"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow_state.gift_id",
                "account": "escrowState"
              }
            ]
          },
          "relations": [
            "escrowState"
          ]
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true,
          "relations": [
            "escrowState"
          ]
        },
        {
          "name": "senderTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrowState",
      "discriminator": [
        19,
        90,
        148,
        111,
        55,
        130,
        229,
        108
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "giftIdTooLong",
      "msg": "Gift ID cannot exceed 64 characters"
    },
    {
      "code": 6001,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6002,
      "name": "alreadyClaimed",
      "msg": "Gift has already been claimed"
    },
    {
      "code": 6003,
      "name": "unauthorizedRecipient",
      "msg": "Only the designated recipient can claim this gift"
    },
    {
      "code": 6004,
      "name": "unauthorizedSender",
      "msg": "Only the sender can refund this gift"
    }
  ],
  "types": [
    {
      "name": "escrowState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "giftId",
            "type": "string"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vault",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
