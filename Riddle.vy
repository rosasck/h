# pragma @version ^0.2.4

# Wraps all values related to a Riddle Guess 
struct riddle_entry:
    signer: address
    name: String[32]
    guess: String[100]
    date: uint256
    bounty_entry: uint256

# Wraps all values related to a Riddle
struct riddle:
    signer: address
    riddle_question: String[300]
    riddle_answer: String[100]
    prize: uint256
    
# Amount of Guesses Allowed 
ENTRIES: constant(uint256) = 5

# Owner of the Riddle to send all funds upon selfdestruct
owner: public(address)

# Keeps track if a riddle has been submitted to play with
riddle_submission: public(bool)

# List of Guesses for the Riddle 
re: public(riddle_entry[ENTRIES])
rv: public(riddle)

# Current minimum value that a guess costs, depending on round of guessing
bounty: public(uint256)

winnings: uint256


# Event emitted to web3 front-end when the guestbook changes. Sends the new bounty value.
event Entry:
    value: uint256

# Constructor that initializes guestbook and its initial entries
@external
def __init__():
    self.owner = msg.sender
    self.winnings = 0
    self.bounty = 0
    self.riddle_submission = False
    for i in range(ENTRIES):
        self.re[i].signer = msg.sender
        self.re[i].name = "Owner of Contract"
        self.re[i].guess = "My Guess Submmited"
        self.re[i].date = block.timestamp
        self.re[i].bounty_entry = convert(i*10,uint256)

        

# Finds the minimum bounty value and updates the storage variable for it
@internal
def update_bounty():
    minimum: uint256 = 0
    for i in range(ENTRIES):
        if (minimum == 0) or (self.re[i].bounty_entry < minimum):
            minimum = self.re[i].bounty_entry
    self.bounty = minimum
    self.winnings = self.winnings + minimum

@external
@payable
def input_riddle(entry: String[300], answer: String[100], bounty: uint256):
    assert self.riddle_submission == False
    self.rv.signer= msg.sender
    self.rv.riddle_question= entry
    self.rv.riddle_answer= answer
    self.rv.prize = bounty
    self.winnings = bounty
    self.riddle_submission = True

# Pay the Winner
@internal
def check_answer(addy: address):
    assert self.riddle_submission == True
    selfdestruct(addy)
    

@external
@payable
def riddle_guess(name: String[32], guess: String[100]):
    assert msg.value > self.bounty
    assert self.riddle_submission == True
    if keccak256(guess) == keccak256(self.rv.riddle_answer):
       self.check_answer(msg.sender) 
    self.winnings = self.winnings + msg.value
    for i in range(ENTRIES):
        if self.re[i].bounty_entry == self.bounty: #for every guess it increases the bounty by 10 wei 
            self.re[i].signer = msg.sender
            self.re[i].name = name
            self.re[i].guess = guess
            self.re[i].date = block.timestamp
            self.re[i].bounty_entry = msg.value
            break
    self.update_bounty()
    log Entry(self.bounty)

    

# Destroy contract and return funds to the contract owner
@external
def cashOut():
    selfdestruct(self.owner)
    
# Contract accepts any ETH someone wants to send us!
@external
@payable
def __default__():
    pass