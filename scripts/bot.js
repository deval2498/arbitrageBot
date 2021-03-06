
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
  const provider = new ethers.getDefaultProvider('https://kovan.infura.io/v3/395015b6899447c8803a6977d5b3d543')
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
  const oneEth = ethers.utils.parseEther('1')
  const uniswapAmountsOut = await uniswaprouter.getAmountsOut(amountIn,[wethAddress,daiAddress])
  const for1ETHUni = await uniswaprouter.getAmountsOut(oneEth,[wethAddress,daiAddress])
  const reverseSwapUni = await uniswaprouter.getAmountsIn(amountIn,path2)
  const reverseSwapSushi = await sushiswaprouter.getAmountsIn(amountIn,path2)
  const sushiswapAmountsOut = await sushiswaprouter.getAmountsOut(amountIn, [wethAddress,daiAddress])
  const for1ETHSushi = await sushiswaprouter.getAmountsOut(oneEth, [wethAddress,daiAddress])
  const exc1 = uniswapRouterAddress
  
  const exc2 = sushiswapRouterAddress
  const pUniswap = uniswapAmountsOut[1]
  const pSushiswap = sushiswapAmountsOut[1]
  console.log(
    '\n =========== \n On Uniswap \n Amount of Dai for', ethers.utils.formatEther(amountIn),' WETH:',ethers.utils.formatEther(uniswapAmountsOut[1]),
    '\n =========== \n On Sushiswap \n Amount of Dai for', ethers.utils.formatEther(amountIn) ,'WETH:', ethers.utils.formatEther(sushiswapAmountsOut[1])
  )
  console.log("Reverse swap on uniswap:",ethers.utils.formatEther(reverseSwapUni[0]))
  console.log("Reverse swap on Sushiswap:",ethers.utils.formatEther(reverseSwapSushi[0]))
  const balance = await provider.getBalance(signer.address)
  console.log(ethers.utils.formatEther(balance))
  if(pUniswap > pSushiswap){
    console.log('using uniswap first:')
    let gap
    const _exc1 = exc1
    const _exc2 = exc2
    const reverseGap = pUniswap - reverseSwapSushi[0]
    console.log(reverseGap)
    
      gap = pUniswap - reverseSwapSushi[0]
    
    console.log("Gap:",gap.toString())
    const minAmount = ethers.utils.formatEther(uniswapAmountsOut[1])
    //const gasFee = await testDyDxContract.estimateGas.initiateFlashLoan(wethAddress, amountIn, _exc1, _exc2, ethers.utils.parseEther(minAmount.toString()), path1, amountIn.toString(), path2)
    //const feeData = await provider.getGasPrice()
    //const totalGas = gasFee * feeData
    const totalGasEth = 0.000972557502 //ethers.utils.formatEther(totalGas)
    const ethToDollars = (ethers.utils.formatEther(for1ETHUni[1]))
    const totalGasToDollars = totalGasEth*ethToDollars
    const arbOpp = gap - ethers.utils.parseEther(totalGasToDollars.toString())
    console.log("Arbitrage opportunity of:",ethers.utils.formatEther(arbOpp.toString()),"$","\nTransactions cost worth:",totalGasToDollars,"$")
    if(arbOpp > 0){
      console.log("Deploying Loan: For Arbitrage opportunity", arbOpp)
      const tx = await testDyDxContract.initiateFlashLoan(wethAddress, amountIn, _exc1, _exc2, ethers.utils.parseEther(minAmount.toString()), [wethAddress,daiAddress], amountIn.toString(), [daiAddress,wethAddress],{gasLimit: 30000000})
      await tx.wait()
      console.log(tx)
      console.log("Congratulations")
  }
  else{
    console.log("Flash Loan not deployed, try again later!")
  }
}
  else{
    console.log('using sushiswap first:')
    let gap
    const _exc1 = exc2
    const _exc2 = exc1
    const reverseGap = pSushiswap - reverseSwapUni[0]
    console.log(reverseGap)
  
      gap = pSushiswap - reverseSwapUni[0]
    
    console.log("Gap:",gap)
    const minAmount = ethers.utils.formatEther(for1ETHSushi[1])
    //const gasFee = await testDyDxContract.estimateGas.initiateFlashLoan(wethAddress, amountIn, _exc1, _exc2, ethers.utils.parseEther(minAmount.toString()), path1, amountIn.toString(), path2)
    //const feeData = await provider.getGasPrice()
    //const totalGas = gasFee * feeData
    const totalGasEth = 0.000972557502 //ethers.utils.formatEther(totalGas)
    const ethToDollars = (ethers.utils.formatEther(sushiswapAmountsOut[1]))
    const totalGasToDollars = totalGasEth*ethToDollars
    const arbOpp = gap - ethers.utils.parseEther(totalGasToDollars.toString())
    console.log("Arbitrage opportunity of:",ethers.utils.formatEther(arbOpp.toString()),"$","\nTransactions cost worth:",totalGasToDollars,"$")
    if(arbOpp > 0){
      console.log("Deploying Loan: For Arbitrage opportunity", arbOpp)
      const tx = await testDyDxContract.initiateFlashLoan(wethAddress, amountIn, _exc1, _exc2, ethers.utils.parseEther(minAmount.toString()), [wethAddress,daiAddress], amountIn.toString(), [daiAddress,wethAddress],{gasLimit: 30000000})
      await tx.wait()
      console.log(tx)
      console.log("Congratulations")
  }
  else{
    console.log("Flash Loan not deployed, try again later!")
  }
}
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
