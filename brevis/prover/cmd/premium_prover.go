package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/brevis-network/brevis-sdk/sdk/prover"
	"prover/circuits"
)

var premiumPort = flag.Uint("port", 33248, "the port to start the Premium prover service at")

func main() {
	flag.Parse()

	proverService, err := prover.NewService(&circuits.PremiumCircuit{}, prover.ServiceConfig{
		SetupDir: "$HOME/circuitOut/premium",
		SrsDir:   "$HOME/kzgsrs",
		RpcURL:   "https://eth.llamarpc.com",
		ChainId:  1,
	})
	if err != nil {
		fmt.Println("Error initializing Premium prover:", err)
		os.Exit(1)
	}
	
	fmt.Printf("Starting Premium prover service on port %d...\n", *premiumPort)
	proverService.Serve("", *premiumPort)
}