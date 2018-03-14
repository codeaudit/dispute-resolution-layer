const BasicVerificationGame = artifacts.require("./BasicVerificationGame.sol")
const SimpleAdderVM = artifacts.require("./test/SimpleAdderVM.sol")
const web3 = require('web3')

const toResult = (data) => {
  return {
    state: "0x" + data[0].slice(-2),//because of encoding issues, uhhhh....
    stateHash: data[1]
  }
}

contract('BasicVerificationGame query to high step', function(accounts) {
  let basicVerificationGame, simpleAdderVM, gameId

  let program = "0x010203040506070809"
  let programLength = (program.length / 2) - 2
  let output = "0x000000000000000000000000000000000000000000000000000000000000002d"//45
  let step = programLength - 1
  let outputHash = web3.utils.soliditySha3(output)
  let responseTime = 20

  before(async () => {
    basicVerificationGame = await BasicVerificationGame.deployed()
    simpleAdderVM = await SimpleAdderVM.deployed()
  })

  it("should create a new verification game", async () => {
    let tx = await basicVerificationGame.newGame(accounts[1], accounts[2], program, outputHash, programLength, responseTime, SimpleAdderVM.address)
    const result = tx.logs[0].args
    gameId = result.gameId
    assert.equal(result.solver, accounts[1])
    assert.equal(result.verifier, accounts[2])
  })

  it("should query a step", async () => {
    //query final step to make verification game short
    let tx = await basicVerificationGame.query(gameId, step, {from: accounts[2]})

    let query = tx.logs[0].args
    assert.equal(query.stepNumber.toNumber(), step)
    assert.equal(query.gameId, gameId)
  })

  it("should respond to query", async () => {
    let result = toResult(await simpleAdderVM.runSteps.call(program, step))

    let tx = await basicVerificationGame.respond(gameId, step, result.stateHash, {from: accounts[1]})

    let response = tx.logs[0].args
    assert.equal(response.hash, result.stateHash)
    assert.equal(response.gameId, gameId)
  })

  //This needs to be fixed as it is rather awkward....
  it("should query a step again...", async () => {
    //query final step to make verification game short
    let tx = await basicVerificationGame.query(gameId, step, {from: accounts[2]})

    let query = tx.logs[0].args
    assert.equal(query.stepNumber.toNumber(), step)
    assert.equal(query.gameId, gameId)
  })

  it("should perform step verification", async () => {
    let result = toResult(await simpleAdderVM.runSteps.call(program, step))
    await basicVerificationGame.performStepVerification(gameId, result.state, "0x09", outputHash, {from: accounts[1]})

    assert.equal(1, (await basicVerificationGame.status.call(gameId)).toNumber())
  })
})

contract('BasicVerificationGame query to low step', function(accounts) {
  let basicVerificationGame, simpleAdderVM, gameId

  let program = "0x010203040506070809"
  let programLength = (program.length / 2) - 2
  let output = "0x000000000000000000000000000000000000000000000000000000000000002d"//45
  let step = 1
  let outputHash = web3.utils.soliditySha3(output)
  let responseTime = 20

  before(async () => {
    basicVerificationGame = await BasicVerificationGame.deployed()
    simpleAdderVM = await SimpleAdderVM.deployed()
  })

  it("should create a new verification game", async () => {
    let tx = await basicVerificationGame.newGame(accounts[1], accounts[2], program, outputHash, programLength, responseTime, SimpleAdderVM.address)
    const result = tx.logs[0].args
    gameId = result.gameId
    assert.equal(result.solver, accounts[1])
    assert.equal(result.verifier, accounts[2])
  })

  it("should query a step", async () => {
    //query final step to make verification game short
    let tx = await basicVerificationGame.query(gameId, step, {from: accounts[2]})

    let query = tx.logs[0].args
    assert.equal(query.stepNumber.toNumber(), step)
    assert.equal(query.gameId, gameId)
  })

  it("should respond to query", async () => {
    let result = toResult(await simpleAdderVM.runSteps.call(program, step))

    let tx = await basicVerificationGame.respond(gameId, step, result.stateHash, {from: accounts[1]})

    let response = tx.logs[0].args
    assert.equal(response.hash, result.stateHash)
    assert.equal(response.gameId, gameId)
  })

  it("should query a step down", async () => {
    //query final step to make verification game short
    let tx = await basicVerificationGame.query(gameId, step-1, {from: accounts[2]})

    let query = tx.logs[0].args
    assert.equal(query.stepNumber.toNumber(), step-1)
    assert.equal(query.gameId, gameId)
  })

  it("should perform step verification", async () => {
    let result = toResult(await simpleAdderVM.runSteps.call(program, step))
    await basicVerificationGame.performStepVerification(gameId, result.state, "0x09", outputHash, {from: accounts[1]})

    assert.equal(1, (await basicVerificationGame.status.call(gameId)).toNumber())
  })
})

//TODO: Create test where verification game settles in some intermediate step