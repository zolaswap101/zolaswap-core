function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep() {
  return await timeout(10000);
}


function save(chainId, name, value) {

  const fs = require("fs");

  const filename = './zola-addresses/' + chainId + '.json'

  const data = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, "utf8")) : {}

  data[name] = value;

  fs.writeFileSync(filename, JSON.stringify(data, null, 4))

}



async function createRealPool(address) {
  console.log("create LP pool " + address)
  const signers = await ethers.getSigners();
  const nonce = await ethers.provider.getTransactionCount(signers[0].address)
  const { chainId } = await ethers.provider.getNetwork();
  //const blockNumber = await ethers.provider.getBlockNumber();
  const data = get(chainId)
  const tokenA = data.WMATIC
  const tokenB = address

  //console.log("ZolaFactory", data.ZolaFactory)

  if (tokenA == tokenB)
    throw "token names should be different"

  console.log("tokenA", tokenA)
  console.log("tokenB", tokenB)

  const ZolaFactory = await ethers.getContractAt("ZolaFactory", data.ZolaFactory);
  const PoolAddress = await ZolaFactory.createPair(tokenA, tokenB, { nonce, gasLimit: 9000000 })
  
  const result = await PoolAddress.wait(1)
  const event = result.events.find((x)=> x.event == "PairCreated");
  
  const Token = await ethers.getContractAt("PancakeERC20", address);
  
  const symbol = await Token.symbol();

  save(chainId, "MATIC_" + symbol + "_LP", { pair: event.args.pair, tokenA, tokenB } );

  await sleep()

  return true
}

function get(chainId) {
  const fs = require("fs");

  const filename = './zola-addresses/' + chainId + '.json'

  const data = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, "utf8")) : {}

  return data;
}

async function main() {

  const { chainId } = await ethers.provider.getNetwork();
  
  const data = get(chainId);

  await createRealPool(data.USDTToken)
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
