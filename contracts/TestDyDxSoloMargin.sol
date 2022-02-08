// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
pragma experimental ABIEncoderV2;

import "./dydx/DydxFlashLoanBase.sol";
import "./dydx/ICallee.sol";
import "./IUniswapV2Router02.sol";
import "./IUniswapV2Factory.sol";

contract TestDyDxSoloMargin is ICallee, DydxFlashloanBase {
  address private SOLO ;
 /* address private uniswapRouter = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
  address private sushiswapRouter = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
  IUniswapV2Router01 uniswap = IUniswapV2Router01(uniswapRouter);
  IUniswapV2Router01 sushiswap = IUniswapV2Router01(sushiswapRouter); 
*/

  // JUST FOR TESTING - ITS OKAY TO REMOVE ALL OF THESE VARS
  address public flashUser;
  constructor(address _SOLO) {
    SOLO = _SOLO;
  }

  event Log(string message, uint val);

  struct MyCustomData {
    address token;
    uint repayAmount;
    address exc1;
    address exc2;
    uint minAmount;
    address[] path1;
    address[] path2;
    uint amountIn;
  }

  function initiateFlashLoan(address _token, uint _amount, address _exc1, address _exc2, uint _minAmount,address[] memory _path1, uint _amountIn,address[] memory _path2) external {
    ISoloMargin solo = ISoloMargin(SOLO);

    // Get marketId from token address
    /*
    0	WETH
    1	SAI
    2	USDC
    3	DAI
    */
    uint marketId = _getMarketIdFromTokenAddress(SOLO, _token);

    // Calculate repay amount (_amount + (2 wei))
    uint repayAmount = _getRepaymentAmountInternal(_amount);
    IERC20(_token).approve(SOLO, repayAmount);

    /*
    1. Withdraw
    2. Call callFunction()
    3. Deposit back
    */

    Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);

    operations[0] = _getWithdrawAction(marketId, _amount);
    operations[1] = _getCallAction(
      abi.encode(MyCustomData({token: _token, repayAmount: repayAmount, exc1: _exc1, exc2: _exc2,minAmount: _minAmount,path1: _path1, amountIn: _amountIn, path2: _path2}))
    );
    operations[2] = _getDepositAction(marketId, repayAmount);

    Account.Info[] memory accountInfos = new Account.Info[](1);
    accountInfos[0] = _getAccountInfo();

    solo.operate(accountInfos, operations);
  }

  function callFunction(
    address sender,
    Account.Info memory account,
    bytes memory data
  ) public override {
    require(msg.sender == SOLO, "!solo");
    require(sender == address(this), "!this contract");

    MyCustomData memory mcd = abi.decode(data, (MyCustomData));
    uint repayAmount = mcd.repayAmount;
    IUniswapV2Router01 _exc1 = IUniswapV2Router01(mcd.exc1);
    IUniswapV2Router01 _exc2 = IUniswapV2Router01(mcd.exc2);
    uint _minAmount = mcd.minAmount;
    uint _amountIn = mcd.amountIn;
    address[] memory _path1 = mcd.path1;
    address[] memory _path2 = mcd.path2;
    

    uint bal = IERC20(mcd.token).balanceOf(address(this));
    require(bal >= repayAmount, "bal < repay");
    IERC20(_path1[0]).approve(address(_exc1),_amountIn);
    uint[] memory amounts = _exc1.swapExactTokensForTokens(_amountIn, _minAmount, _path1, address(this), block.timestamp);
    IERC20(_path1[1]).approve(address(_exc2),amounts[1]);
    _exc2.swapExactTokensForTokens(amounts[1], repayAmount, _path2, address(this), block.timestamp);
    
    flashUser = sender;
    emit Log("bal", bal);
    emit Log("repay", repayAmount);
    emit Log("bal - repay", bal - repayAmount);
  }
}
// Solo margin contract mainnet - 0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e
// payable proxy - 0xa8b39829cE2246f89B31C013b8Cde15506Fb9A76

// https://etherscan.io/tx/0xda79adea5cdd8cb069feb43952ea0fc510e4b6df4a270edc8130d8118d19e3f4