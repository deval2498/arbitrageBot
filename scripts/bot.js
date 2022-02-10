
const { ethers, artifacts } = require("hardhat");
const hre = require("hardhat");


const uniswapFactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const sushiswapFactoryAddress = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'
const sushiswapRouterAddress = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
const flashLoan = '0x56Ef05B5b803eBeb68EFCAAC015414798b91375a'
const linktoken = '0xa36085F69e2889c224210F603D836748e7dC0088'

const daiAddress = '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa'
const wethAddress = '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
const contractAddress = '0xD72e5A75AD5868BCc76150948a1eEfd44a835315'
const path1 = [wethAddress,daiAddress]
const path2 = [daiAddress,wethAddress]
async function main() {
  const provider = new ethers.getDefaultProvider('https://kovan.infura.io/v3/0be322968c214906a231738f3f6729ef')
  const signer = new ethers.Wallet('e1c0812ab2cb8929e8cf2d58cc5d35c3f8dc91f90cb33713ce79791d91175164',provider)
  console.log('Signer is:',signer.address)

  const uniswapFactory = await artifacts.readArtifact("IUniswapV2Factory")
  const uniswapRouter = await artifacts.readArtifact("IUniswapV2Router02")

  const botContract = await ethers.getContractFactory("TestDyDxSoloMargin")
  const uniswaprouter = new ethers.Contract(uniswapRouterAddress,uniswapRouter.abi,signer)
  const uniswapfactory = new ethers.Contract(uniswapFactoryAddress,uniswapFactory.abi,signer)
  const sushiswapfactory = new ethers.Contract(sushiswapFactoryAddress,uniswapFactory.abi,signer)
  const sushiswaprouter = new ethers.Contract(sushiswapRouterAddress,uniswapRouter.abi,signer)

  const testDyDxContract = new ethers.Contract(contractAddress,botContract.interface,signer)
  const uniswapPair = await uniswapfactory.getPair(daiAddress,wethAddress)
  const sushiswapPair = await sushiswapfactory.getPair(daiAddress,wethAddress)
  console.log('\n',uniswapPair,'\n',sushiswapPair)
  const amountIn = ethers.utils.parseEther('0.01')
  const uniswapAmountOut = await uniswaprouter.getAmountsOut(amountIn,[wethAddress,daiAddress])
  const sushiswapAmountsOut = await sushiswaprouter.getAmountsOut(amountIn, [wethAddress,daiAddress])
  const exc1 = uniswapRouterAddress
  const minAmount = exc1 - 10
  const exc2 = sushiswapRouterAddress
  const pUniswap = uniswapAmountOut[1]
  const pSushiswap = sushiswapAmountsOut[1]
  console.log(path1)
  console.log(
    '\n =========== \n On Uniswap \n Amount of Dai for 0.01 WETH:',ethers.utils.formatEther(uniswapAmountOut[1]),
    '\n =========== \n On Sushiswap \n Amount of Dai for 0.01 WETH:', ethers.utils.formatEther(sushiswapAmountsOut[1])
  )

  const balance = await provider.getBalance(signer.address)
  
  console.log(ethers.utils.formatEther(balance))
  const gasFee = 428750003001250
  if(pUniswap > pSushiswap){
    const _exc1 = exc1
    const _exc2 = exc2
    const gap = pUniswap - pSushiswap
    console.log("Gap:",gap)
    const arbOpp = gap - gasFee
    if(arbOpp > 0){
      console.log("/Deploying Loan: For Arbitrage opportunity", arbOpp)
      await testDyDxContract.initiateFlashLoan(wethAddress, amountIn, _exc1, _exc2, pUniswap, [wethAddress,daiAddress], amountIn.toString(), [daiAddress,wethAddress],{gasLimit: 30000000})
      console.log("Congratulations")
  }
}
  else{
    const _exc1 = exc2
    const _exc2 = exc1
    const gap = pSushiswap - pUniswap
    console.log("Gap:",gap)
    const arbOpp = gap - gasFee
    if(arbOpp > 0){
      console.log("Deploying Loan: For Arbitrage opportunity", arbOpp)
      await testDyDxContract.initiateFlashLoan(wethAddress, amountIn, _exc1, _exc2, pSushiswap, [wethAddress,daiAddress], amountIn.toString(), [daiAddress,wethAddress],{gasLimit: 30000000})
      console.log("Congratulations")
  }
}
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
