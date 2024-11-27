---
icon: file-signature
description: Ton Network Jetton Smart Contract
---

# Jetton Smart Contract

<figure><img src="https://miro.medium.com/v2/resize:fit:1400/1*cPImuKaGiSDnDj9dDttN-Q.jpeg" alt=""><figcaption></figcaption></figure>

#### **Overview**

This Jetton smart contract handles the minting, burning, buying, and selling of Jetton tokens, using a bonding curve for price calculations. It supports role-based access control and includes utility functions for interacting with Jetton wallets.

{% hint style="info" %}
Want to learn more about Jetton? Check out Ton network official doc[ here](https://docs.ton.org/develop/dapps/asset-processing/jettons).
{% endhint %}

#### Repository: [https://github.com/k-purge/cabal-town-contract](https://github.com/k-purge/cabal-town-contract)

####

**Methods**

**Persistent Storage**

• roles: A global cell that stores a map of addresses to their assigned roles (role bitmask).

````
```func
;; Persistent storage for roles (map of address -> role bitmask)
global cell roles;
```
````

***

**Data Management**

* **load\_data() -> (int, int, int, int, slice, cell, cell)**

Loads the Jetton contract’s state data:

• total\_supply: Total minted supply of Jettons.

• circulating\_supply: Total Jettons in circulation.

• reserve\_rate: Connector weight for bonding curve calculations.

• reserve\_balance: Reserve tokens held.

• admin\_address: Address with admin privileges.

• content: Metadata about the Jetton.

• jetton\_wallet\_code: Code for Jetton wallets.

````
```func
(int, int, int, int, slice, cell, cell) load_data() inline {
  slice ds = get_data().begin_parse();
  return (
      ds~load_uint(128), ;; total_supply
      ds~load_uint(128),  ;; circulating_supply
      ds~load_uint(32),  ;; reserve_rate
      ds~load_uint(64),  ;; reserve_balance
      ds~load_msg_addr(), ;; admin_address
      ds~load_ref(), ;; content
      ds~load_ref()  ;; jetton_wallet_code
  );
}
```
````



* **save\_data(total\_supply, circulating\_supply, reserve\_rate, reserve\_balance, admin\_address, content, jetton\_wallet\_code)**

Saves the Jetton contract’s state data.

````
```func
() save_data(int total_supply, int circulating_supply, int reserve_rate, int reserve_balance, slice admin_address, cell content, cell jetton_wallet_code) impure inline {
  set_data(begin_cell()
            .store_uint(total_supply, 128)
            .store_uint(circulating_supply, 128)
            .store_uint(reserve_rate, 32)
            .store_uint(reserve_balance, 64)
            .store_slice(admin_address)
            .store_ref(content)
            .store_ref(jetton_wallet_code)
           .end_cell()
          );
}
```
````

***

**Role Management**

* **has\_role(address, role) -> int**

Checks if an address has a specific role.

````
```func
;; Check if an address has a specific role
int has_role(slice address, slice role) inline {
    (int wc, int addr_hash) = parse_std_addr(address);
    throw_unless(error::pool_workchain_unmatched, wc == 0);  ;; error if the workchain is incorrect

    (slice selected_role, int found?) = roles.udict_get?(ADDR_SIZE, addr_hash);

    return (found? & equal_slices(role, selected_role)) != 0;
}
```
````



* **add\_role(sender\_address, target\_address, role)**

Adds a role to a target address. Only callable by the admin.

````
```func
;; Add a role to an address (only ADMIN can do this)
() add_role(slice sender_address, slice target_address, slice role) impure {
    var (_, _, _, _, admin_address, _, _) = load_data();
    throw_unless(error::unauthorized_request, equal_slices(sender_address, admin_address)); ;; Only ADMIN can assign roles
    
    (int wc, int addr_hash) = parse_std_addr(target_address);
    throw_unless(error::pool_workchain_unmatched, wc == 0);  ;; error if the workchain is incorrect
    
    roles~udict_set(ADDR_SIZE, addr_hash, role);
}
```
````



***

**Bonding Curve Calculations**

* **cal\_purchase\_return(reserve\_token\_received, circulating\_supply, reserve\_rate, reserve\_balance) -> int**

This method calculates the number of tokens (purchase\_return) a buyer will receive when they deposit a certain amount of reserve tokens (reserve\_token\_received).

````
```func
;; Formula:
;; _supply * (((1 + _depositAmount / _reservedBalance) ^ (1 / _connectorWeight)) - 1)
int cal_purchase_return(int reserve_token_received, int circulating_supply, int reserve_rate, int reserve_balance) impure inline {
    ;; Step 1: Compute the fraction (_depositAmount / _reservedBalance)
    int fraction = muldivr(reserve_token_received, 1 << 248, reserve_balance);
    
    ;; Step 2: Add 1 to the fraction
    int base = (1 << 248) + fraction;
    
    ;; Step 3: Compute the natural logarithm of the base
    int log_value = fixed248::log(base);
    
    ;; Step 4: Scale the logarithm by (r / _connectorWeight)
    int scaled_log = muldivr(log_value, reserve_rate, RATE_SCALER);
    
    ;; Step 5: Compute the exponential of the scaled logarithm
    int exp_value = fixed248::exp(scaled_log);
    
    ;; Step 6: Subtract 1 from the exponential result
    int adjusted_exp = exp_value - (1 << 248);
    
    ;; Step 7: Multiply by _supply to compute the final purchase return
    int purchase_return = muldivr(circulating_supply, adjusted_exp, 1 << 248);
    
    return purchase_return;
}
```

````

**Formula:**

$$
\text{purchase\_return} = \text{circulating\_supply} \cdot \left( \left( 1 + \frac{\text{reserve\_token\_received}}{\text{reserve\_balance}} \right)^{\frac{1}{\text{reserve\_rate}}} - 1 \right)
$$

**Steps in the Method:**

1. **Fraction of Reserve Tokens Deposited:**

$$
\text{fraction} = \frac{\text{reserve\_token\_received}}{\text{reserve\_balance}}
$$

This calculates how much of the reserve is added relative to the current balance.

2. **Base for Exponentiation:**

$$
\text{base} = 1 + \text{fraction}
$$

3. **Logarithmic and Exponential Transformation:**

Using logarithmic and exponential functions, the method determines the effect of the reserve rate on token issuance. The reserve rate adjusts how sensitive the token price is to reserve changes.

4. **Adjusted Exponential:**

The exponential growth simulates the effect of increasing reserve on token creation:

$$
\text{adjusted\_exp} = \left( \text{base}^{\frac{1}{\text{reserve\_rate}}} \right) - 1
$$

5. **Final Return:**

Multiply the adjusted exponential by the circulating supply:

$$
\text{purchase\_return} = \text{circulating\_supply} \cdot \text{adjusted\_exp}
$$





* **cal\_sale\_return(sell\_amt, circulating\_supply, reserve\_rate, reserve\_balance) -> int**

This method calculates the amount of reserve tokens (sale\_return) received when a user sells a certain number of tokens (sell\_amt).

````
```func
;; Formula:
;; Return = _connectorBalance * (1 - (1 - _sellAmount / _supply) ^ (1 / (_connectorWeight / 1000000)))
;; Return = _connectorBalance * (1 - exp((1000000 / _connectorWeight) * log(1 - _sellAmount / _supply)))
int cal_sale_return(int sell_amt, int circulating_supply, int reserve_rate, int reserve_balance) impure inline {
    ;; Ensure circulating_supply and sell_amt are non-zero to avoid division by zero
    if ((circulating_supply == 0) | (sell_amt == 0)) {
        return 0;  ;; No tokens to convert or no supply, return zero
    }

    ;; Handle the edge case where _sellAmount == _supply
    if (sell_amt >= circulating_supply) {
      return reserve_balance;
    }

    ;; Step 1: Compute log(1 - _sellAmount / _supply)
    int log_value = fixed248::log((1 << 248) - muldivr(sell_amt, 1 << 248, circulating_supply));
    
    ;; Step 2: Scale log_value by (1000000 / _connectorWeight)
    int scaled_log = muldivr(log_value, RATE_SCALER, reserve_rate);
    
    ;; Step 3: Compute exp(scaled_log)
    int exp_value = fixed248::exp(scaled_log);
    
    ;; Step 4: Compute the final return
    int result = muldivr(reserve_balance, (1 << 248) - exp_value, 1 << 248);
    
    return result;
}
```
````



**Formula:**

$$
\text{sale\_return} = \text{reserve\_balance} \cdot \left( 1 - \left( 1 - \frac{\text{sell\_amt}}{\text{circulating\_supply}} \right)^{\frac{1}{\text{reserve\_rate}}} \right)
$$

**Steps in the Method:**

1. **Fraction of Tokens Sold:**

$$
\text{fraction} = \frac{\text{sell\_amt}}{\text{circulating\_supply}}
$$

This determines the portion of the total supply being sold.

2. **Base for Logarithmic Transformation:**

Compute the remaining supply after the sale:

$$
\text{remaining\_fraction} = 1 - \text{fraction}
$$

3. **Logarithmic and Exponential Transformation:**

Using logarithmic and exponential functions, the method calculates the impact of selling tokens on the reserve balance.

4. **Final Adjustment:**

The adjustment simulates the reserve tokens released back to the seller:

$$
\text{sale\_return} = \text{reserve\_balance} \cdot \left( 1 - \left(\text{remaining\_fraction}^{\frac{1}{\text{reserve\_rate}}}\right) \right)
$$



{% hint style="info" %}
\*\* **Key Points about Bonding Curve Pricing:**

1. **Reserve Rate:**

The reserve\_rate determines the slope of the bonding curve. A lower reserve rate makes the token price more sensitive to supply changes.

2. **Exponential Growth:**

The formulas use logarithmic and exponential transformations to simulate the nonlinear growth or decay of token price based on supply and demand.

3. **Dynamic Pricing:**

Both methods ensure that the token’s price increases as the circulating supply grows and decreases as tokens are sold.
{% endhint %}





***

**Jetton Transactions**

* **transfer\_buy\_tokens(sender\_address, jettonAmt, jetton\_wallet\_code, value)**

Handles the transfer of Jettons to a buyer after a purchase.

````
```func

() transfer_buy_tokens(slice sender_address, int jettonAmt, cell jetton_wallet_code, int value) impure {
  ;; BUY jettons
  cell state_init = calculate_jetton_wallet_state_init(sender_address, my_address(), jetton_wallet_code);
  slice jetton_wallet_address = calculate_jetton_wallet_address(state_init);
  slice from_wallet_address = my_address();
  slice to_wallet_address = sender_address;

  var master_msg = begin_cell()
            .store_uint(op::internal_transfer(), 32)
            .store_uint(0, 64) ;; quert_id
            .store_coins(jettonAmt)
            .store_slice(to_wallet_address) ;; from_address
            .store_slice(to_wallet_address) ;; response_address
            .store_coins(10000000) ;; forward_amount
            .store_uint(0, 1) ;; forward_payload in this slice, not separate cell
            .end_cell();

  var msg = begin_cell()
    .store_uint(0x18, 6)
    .store_slice(jetton_wallet_address)
    .store_coins(value) ;; for transferToJWallet
    .store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
    .store_ref(state_init)
    .store_ref(master_msg);

  send_raw_message(msg.end_cell(), sendmode::PAY_FEES_SEPARATELY); ;; pay transfer fees separately, revert on errors
}
```
````



* **transfer\_sell\_tokens(sender\_address, jettonAmt, tonAmt, value, jetton\_wallet\_code)**

Handles the transfer of reserve tokens to a seller after a Jetton sale.

````
```func
() transfer_sell_tokens(slice sender_address, int jettonAmt, int tonAmt, int value, cell jetton_wallet_code) impure {
  ;; SELL jettons
  cell state_init = calculate_jetton_wallet_state_init(sender_address, my_address(), jetton_wallet_code);
  slice jetton_wallet = calculate_jetton_wallet_address(state_init);
  
  var master_msg = begin_cell()
            .store_uint(op::sell_token(), 32)
            .store_uint(0, 64) ;; quert_id
            .store_coins(jettonAmt)
            .store_slice(my_address())
            .store_slice(sender_address) ;; response_address
            .store_uint(0, 1) ;; custom_payload:(Maybe ^Cell)
            .store_coins(10000000) ;; forward_amount
            .store_uint(0, 1) ;; forward_payload in this slice, not separate cell
            .end_cell();

  var msg = begin_cell()
    .store_uint(0x10, 6) ;; NON_BOUNCEABLE
    .store_slice(jetton_wallet) ;; jetton seller
    .store_coins(value) ;; for transferToJWallet
    .store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
    .store_ref(state_init)
    .store_ref(master_msg);

  send_raw_message(msg.end_cell(), sendmode::PAY_FEES_SEPARATELY); ;; pay transfer fees separately, revert on errors

  ;; send back TON to seller
  send_ton(sender_address, tonAmt);
}
```
````



* **send\_ton(to\_address, tonAmt)**

Sends TON coins to a specified address.

````
```func
() send_ton(slice to_address, int tonAmt) impure {
  ;; SEND jettons
  if (to_address.preload_uint(2) != 0) {
    var msg = begin_cell()
      .store_uint(0x18, 6) ;; nobounce - int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool src:MsgAddress -> 011000
      .store_slice(to_address)
      .store_coins(tonAmt)
      .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1);

    send_raw_message(msg.end_cell(), sendmode::PAY_FEES_SEPARATELY);
  }
  return ();
}
```
````



* **buy\_tokens(msg\_value, sender\_address, reserve\_token\_received)**

Executes the purchase of Jettons:

• Transfers TON to the contract.

• Mints Jettons and assigns them to the buyer.

````
```func
() buy_tokens(int msg_value, slice sender_address, int reserve_token_received) impure {
  var (total_supply, circulating_supply, reserve_rate, reserve_balance, admin_address, content, jetton_wallet_code) = load_data();

  ;; Transfer TON from buyer to the contract
  ;; throw if not enough msg_value
  throw_unless(76, msg_value > 0);

  int new_reserve_balance = reserve_balance + reserve_token_received;
  
  ;; Calculate the cost using sigmoid bonding curve
  int purchase_amt = cal_purchase_return(reserve_token_received, circulating_supply, reserve_rate, new_reserve_balance);

  ;; Transfer tokens from contract to buyer
  transfer_buy_tokens(sender_address, purchase_amt, jetton_wallet_code, msg_value);

  ;; Increase circulating supply
  circulating_supply += purchase_amt;
  save_data(total_supply, circulating_supply, reserve_rate, new_reserve_balance, admin_address, content, jetton_wallet_code);
}
```
````



* **sell\_tokens(msg\_value, sender\_address, sell\_amt)**

Executes the sale of Jettons:

• Burns Jettons from the seller.

• Transfers reserve tokens to the seller.

````
```func
() sell_tokens(int msg_value, slice sender_address, int sell_amt) impure {
  var (total_supply, circulating_supply, reserve_rate, reserve_balance, admin_address, content, jetton_wallet_code) = load_data();

  ;; Calculate the sale return in ton
  int sale_return = cal_sale_return(sell_amt, circulating_supply, reserve_rate, reserve_balance);

  transfer_sell_tokens(sender_address, sell_amt, sale_return, msg_value, jetton_wallet_code);

  ;; Increase circulating supply
  circulating_supply -= sell_amt;
  reserve_balance -= sale_return;
  save_data(total_supply, circulating_supply, reserve_rate, reserve_balance, admin_address, content, jetton_wallet_code);
}

```
````



* **mint\_tokens(to\_address, jetton\_wallet\_code, amount, master\_msg)**

Mints new Jettons and assigns them to a specified wallet. Callable only by the admin.

````
```func
() mint_tokens(slice to_address, cell jetton_wallet_code, int amount, cell master_msg) impure {
  var (_, _, _, _, admin_address, _, _) = load_data();
  ;; Check if the caller is the contract owner
  throw_unless(73, equal_slices(to_address, admin_address));

  cell state_init = calculate_jetton_wallet_state_init(to_address, my_address(), jetton_wallet_code);
  slice to_wallet_address = calculate_jetton_wallet_address(state_init);
  var msg = begin_cell()
    .store_uint(0x18, 6)
    .store_slice(to_wallet_address)
    .store_coins(amount)
    .store_uint(4 + 2 + 1, 1 + 4 + 4 + 64 + 32 + 1 + 1 + 1)
    .store_ref(state_init)
    .store_ref(master_msg);
  send_raw_message(msg.end_cell(), sendmode::PAY_FEES_SEPARATELY); ;; pay transfer fees separately, revert on errors
}
```
````



***

**Internal Message Processing**

* **recv\_internal(my\_balance, msg\_value, in\_msg\_full, in\_msg\_body)**

Handles incoming messages and processes operations:

• Buy/Sell tokens.

• Add roles.

• Update bonding curve parameters.

• Mint tokens.

• Handle burn notifications.

````
```func

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; ignore empty messages
    if (in_msg_body.slice_empty?()) {
        return ();
    }
    
    ;; Parse the incoming message
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);

    ;; Ignore bounced messages
    if (flags & 1) {
        return ();
    }

    slice sender_address = cs~load_msg_addr();

    ;; Load contract data
    var (total_supply, circulating_supply, reserve_rate, reserve_balance, admin_address, content, jetton_wallet_code) = load_data();

    ;; Parse operation and query ID
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);

    ;; Buy tokens
    if (op == op::buy_token()) {
        int reserve_token_received = in_msg_body~load_coins();
        buy_tokens(msg_value, sender_address, reserve_token_received);
        return ();
    }

    ;; Sell tokens
    if (op == op::sell_token()) {
        int sell_amt = in_msg_body~load_coins();
        sell_tokens(msg_value, sender_address, sell_amt);
        return ();
    }

    ;; Add role
    if (op == op::add_role()) {
        slice target_address = cs~load_msg_addr();
        cell role = in_msg_body~load_ref();
        slice role_slice = role.begin_parse();

        add_role(sender_address, target_address, role_slice);
        return ();
    }

    ;; Update bonding curve parameters
    ;; Required only operator can update
    if (op == op::update_bonding_curve_data()) {
      throw_unless(error::unauthorized_update_request, has_role(sender_address, ROLE_OPERATOR)); ;; Only OPERATOR can update bonding curve
      int new_reserve_rate = in_msg_body~load_uint(32);
      int new_reserve_balance = in_msg_body~load_uint(64);
      save_data(total_supply, circulating_supply, new_reserve_rate, new_reserve_balance, admin_address, content, jetton_wallet_code);
      return ();
    }

    ;; Mint new tokens 
    ;; Required only minter can mint
    if (op == op::mint()) {
        throw_unless(error::unauthorized_mint_request, has_role(sender_address, ROLE_MINTER)); ;; Only MINTER can mint
        slice to_address = in_msg_body~load_msg_addr();
        int amount = in_msg_body~load_coins();
        cell master_msg = in_msg_body~load_ref();
        
        ;; Parse the master message
        slice master_msg_cs = master_msg.begin_parse();
        master_msg_cs~skip_bits(32 + 64); ;; Skip op and query_id
        int jetton_amount = master_msg_cs~load_coins();

        mint_tokens(to_address, jetton_wallet_code, amount, master_msg);
        save_data(total_supply + jetton_amount, circulating_supply + jetton_amount, reserve_rate, reserve_balance, admin_address, content, jetton_wallet_code);
        return ();
    }

    ;; Handle burn notifications
    if (op == op::burn_notification()) {
        int jetton_amount = in_msg_body~load_coins();
        slice from_address = in_msg_body~load_msg_addr();
        throw_unless(74,
            equal_slices(calculate_user_jetton_wallet_address(from_address, my_address(), jetton_wallet_code), sender_address)
        );
        save_data(total_supply - jetton_amount, circulating_supply - jetton_amount, reserve_rate, reserve_balance, admin_address, content, jetton_wallet_code);
        
        ;; Handle excess return if applicable
        slice response_address = in_msg_body~load_msg_addr();
        if (response_address.preload_uint(2) != 0) {
          var msg = begin_cell()
            .store_uint(0x10, 6) ;; nobounce - int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool src:MsgAddress -> 011000
            .store_slice(response_address)
            .store_coins(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(op::excesses(), 32)
            .store_uint(query_id, 64);
          send_raw_message(msg.end_cell(), sendmode::IGNORE_ERRORS + sendmode::CARRY_ALL_REMAINING_MESSAGE_VALUE);
        }
        return ();
    }

    ;; If no valid operation is found, throw an error
    throw(0xffff);
}
```
````



***

**Public Methods**

* **get\_jetton\_data() -> (int, int, slice, cell, cell, int, int, int)**

Retrieves Jetton contract data:

• total\_supply

• circulating\_supply

• reserve\_rate

• reserve\_balance

• admin\_address

• content

• jetton\_wallet\_code

````
```func
(int, int, slice, cell, cell, int, int, int) get_jetton_data() method_id {
    var (total_supply, circulating_supply, reserve_rate, reserve_balance, admin_address, content, jetton_wallet_code) = load_data();
    return (total_supply, -1, admin_address, content, jetton_wallet_code, circulating_supply, reserve_rate, reserve_balance);
}
```
````





* **get\_wallet\_address(owner\_address) -> slice**

Calculates the Jetton wallet address for a given owner address.

````
```func
slice get_wallet_address(slice owner_address) method_id {
    var (total_supply, circulating_supply, reserve_rate, reserve_balance, admin_address, content, jetton_wallet_code) = load_data();
    return calculate_user_jetton_wallet_address(owner_address, my_address(), jetton_wallet_code);
}
```
````





* **get\_purchase\_return(reserve\_token\_received) -> int**

Estimates the number of Jettons received for a given deposit of reserve tokens.

````
```func
int get_purchase_return(int reserve_token_received) method_id {
  var (_, circulating_supply, reserve_rate, reserve_balance, _, _, _) = load_data();
  int fee = reserve_token_received * NETWORK_FEE_RATE / 100;
  int token_received_after_fee = reserve_token_received - fee;

  int new_reserve_balance = token_received_after_fee + reserve_balance;
  return cal_purchase_return(reserve_token_received, circulating_supply, reserve_rate, new_reserve_balance);
}
```
````





* **get\_sale\_return(sell\_amt) -> int**

Estimates the reserve tokens returned for a given number of Jettons sold.

````
```func
int get_sale_return(int sell_amt) method_id {
  var (_, circulating_supply, reserve_rate, reserve_balance, _, _, _) = load_data();
  
  int sale_return = cal_sale_return(sell_amt, circulating_supply, reserve_rate, reserve_balance);

  int fee = sale_return * NETWORK_FEE_RATE / 100;
  return sale_return - fee;
}
```
````



***

**Error Codes**

• 76: Insufficient msg\_value during purchase.

• 73: Unauthorized mint request.

• 74: Invalid burn notification sender.

• error::unauthorized\_request: Unauthorized role modification attempt.

• error::unauthorized\_update\_request: Unauthorized bonding curve update attempt.



***

**Constants and Utilities**

• op::buy\_token(): Operation code for buying tokens.

• op::sell\_token(): Operation code for selling tokens.

• op::add\_role(): Operation code for adding roles.

• op::update\_bonding\_curve\_data(): Operation code for updating bonding curve parameters.

• op::mint(): Operation code for minting tokens.

• op::burn\_notification(): Operation code for handling burn notifications.

• ADDR\_SIZE: Standard address size constant.

• ROLE\_OPERATOR: Role identifier for operators.

• ROLE\_MINTER: Role identifier for minters.

• RATE\_SCALER: Scaling factor for reserve rates.

• NETWORK\_FEE\_RATE: Fee rate applied to transactions.

