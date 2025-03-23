package circuits

import (
	"github.com/brevis-network/brevis-sdk/sdk"
)

type ZakatCircuit struct{}

var _ sdk.AppCircuit = &ZakatCircuit{}

func (c *ZakatCircuit) Allocate() (maxReceipts, maxStorage, maxTransactions int) {
	return 32, 0, 0
}

func (c *ZakatCircuit) Define(api *sdk.CircuitAPI, in sdk.DataInput) error {
	receipts := sdk.NewDataStream(api, in.Receipts)
	receipt := sdk.GetUnderlying(receipts, 0)

	// Verify the user's address from topic
	api.Uint248.AssertIsEqual(receipt.Fields[0].IsTopic, sdk.ConstUint248(1))
	api.Uint248.AssertIsEqual(receipt.Fields[0].Index, sdk.ConstUint248(1))
	
	// Verify the asset value from data
	api.Uint248.AssertIsEqual(receipt.Fields[1].IsTopic, sdk.ConstUint248(0))
	api.Uint248.AssertIsEqual(receipt.Fields[1].Index, sdk.ConstUint248(0))
	
	// Ensure fields are from the same log entry
	api.Uint32.AssertIsEqual(receipt.Fields[0].LogPos, receipt.Fields[1].LogPos)

	// Output required fields for verification
	api.OutputUint(64, api.ToUint248(receipt.BlockNum))
	api.OutputAddress(api.ToUint248(receipt.Fields[0].Value)) // User address
	api.OutputBytes32(receipt.Fields[1].Value)                // Asset value
	
	return nil
}