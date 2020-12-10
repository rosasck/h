/* ================================================================================*/
/* Javascript code for Guestbook DApp
/* ================================================================================*/
/* Check if Metamask is installed. */
if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
} else {
    console.log('Please install MetaMask or another browser-based wallet');
}
/* Instantiate a Web3 client that uses Metamask for transactions.  Then,
 * enable it for the site so user can grant permissions to the wallet */
const web3 = new Web3(window.ethereum);
window.ethereum.enable();
/* Grab ABI from compiled contract (e.g. in Remix) and fill it in.
 * Grab address of contract on the blockchain and fill it in.
 * Use the web3 client to instantiate the contract within program */
var RiddleABI = [{"name":"Entry","inputs":[{"type":"uint256","name":"value","indexed":false}],"anonymous":false,"type":"event"},{"outputs":[],"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"name":"input_riddle","outputs":[],"inputs":[{"type":"string","name":"entry"},{"type":"string","name":"answer"},{"type":"uint256","name":"bounty"}],"stateMutability":"payable","type":"function","gas":704969},{"name":"riddle_guess","outputs":[],"inputs":[{"type":"string","name":"name"},{"type":"string","name":"guess"}],"stateMutability":"payable","type":"function","gas":1928665},{"name":"cashOut","outputs":[],"inputs":[],"stateMutability":"nonpayable","type":"function","gas":26229},{"stateMutability":"payable","type":"fallback"},{"name":"owner","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1301},{"name":"riddle_submission","outputs":[{"type":"bool","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1331},{"name":"re","outputs":[{"type":"address","name":"signer"},{"type":"string","name":"name"},{"type":"string","name":"guess"},{"type":"uint256","name":"date"},{"type":"uint256","name":"bounty_entry"}],"inputs":[{"type":"uint256","name":"arg0"}],"stateMutability":"view","type":"function","gas":19516},{"name":"rv","outputs":[{"type":"address","name":"signer"},{"type":"string","name":"riddle_question"},{"type":"string","name":"riddle_answer"},{"type":"uint256","name":"prize"}],"inputs":[],"stateMutability":"view","type":"function","gas":27249},{"name":"bounty","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1421}];
var Riddle = new web3.eth.Contract(RiddleABI,'0x739845414056a9485a53Ea96a481bc44f023f1a7');
/* ================================================================================*/
/* Update the UI with current wallet account address when called */
async function updateAccount() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const account = accounts[0];
  const accountNode = document.getElementById("account");
  if (accountNode.firstChild)
    accountNode.firstChild.remove();
  var textnode = document.createTextNode(account);
  accountNode.appendChild(textnode);
}
/* ================================================================================*/
/* Update the riddle to be guessed */
async function addRiddle(){
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    const riddle = document.getElementById("riddleToGuess").value;
    const answer = document.getElementById("answer").value;
    const prize = document.getElementById("prizeBounty").value;
    document.getElementById("riddleToG").innerHTML= document.getElementById("riddleToGuess").value;
    bid = parseInt(prize);
    const transactionParameters = {
            from: account,
            gasPrice: 0x1D91CA3600,
            value: bid
    };
    updateRiddle();
    document.getElementById("riddleToGuess").innerText="";
    document.getElementById("answer").innerHTML="";
    document.getElementById("prizeBounty").innerHTML=""; 

    await Riddle.methods.input_riddle(riddle,answer, prize).send(transactionParameters);
}
/* ================================================================================*/
function updateRiddle(){
    console.log("We got to update riddle");
    const riddle = document.getElementById("riddleToGuess").value;
    const riddleToGuessNode = document.getElementById("riddleToGuess");
    if (riddleToGuessNode.firstChild)
    riddleToGuessNode.firstChild.remove();
    var textnode = document.createTextNode(riddle);
    riddleToGuessNode.appendChild(textnode);
}
/* ================================================================================*/
/* Update the UI with current minimum bounty when called */
async function updateBounty(){
  const bounty = await Riddle.methods.bounty().call();
  updateBountyUI(bounty);
}
function updateBountyUI(value){
  const bountyNode = document.getElementById("bounty");
  if (bountyNode.firstChild)
    bountyNode.firstChild.remove();
  var textnode = document.createTextNode(value + " Wei");
  bountyNode.appendChild(textnode);
}
/* ================================================================================*/
/* Update the UI with Riddle entries from contract when called */
async function updateEntries(){
  const entriesNode = document.getElementById("entries");
  while (entriesNode.firstChild) {
    entriesNode.firstChild.remove();
  }
  for (var i = 0 ; i < 3; i++) {
      var entry = await Riddle.methods.re(i).call();
      const nameAndGuess = document.createTextNode(
          entry.name + " <" + entry.guess + ">"
      );
      const wallet = document.createTextNode(entry.signer);
      const entrydate = new Date(parseInt(entry.date)*1000);
      const signedOn = document.createTextNode("signed on " + entrydate.toUTCString() + " for " + entry.bounty_entry + " Wei");
      const guess = document.createTextNode(entry.guess);
      const br1 = document.createElement("br");
      const br2 = document.createElement("br");
      const br3 = document.createElement("br");
      const p = document.createElement("p");
      p.classList.add("entry");
      p.appendChild(nameAndGuess);
      p.appendChild(br1);
      p.appendChild(wallet);
      p.appendChild(br2);
      p.appendChild(signedOn);
      p.appendChild(br3);
      p.appendChild(guess);
      entriesNode.appendChild(p);
  }
}
/* Issue a transaction to sign the guestbook based on form field values */
async function sign() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const account = accounts[0];
  const name = document.getElementById("name").value;
  const guess = document.getElementById("guess").value;
  const bounty = await Riddle.methods.bounty().call();
  bid = parseInt(bounty) + 10;
  const transactionParameters = {
          from: account,
          gasPrice: 0x1D91CA3600,
          value: bid
  };
  await Riddle.methods.riddle_guess(name, guess).send(transactionParameters);
};
/* Register a handler for when contract emits an Entry event after Guestbook is
 * signed to reload the page */
Riddle.events.Entry().on("data", function(event) {
  updateBountyUI(event.returnValues.value);
  updateEntries();
});
/* Create submission button.  Then, register an event listener on it to invoke sign
 * transaction when clicked */
const button = document.getElementById('sign');
button.addEventListener('click', () => {
  sign();
});      
                                                                                                                                                                                                                                                                                                                                                                                                               