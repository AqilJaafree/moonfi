package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/brevis-network/brevis-sdk/sdk/prover"
	"prover/circuits"
)

var zakatPort = flag.Uint("port", 33247, "the port to start the Zakat prover service at")

func main() {
	flag.Parse()

	proverService, err := prover.NewService(&circuits.ZakatCircuit{}, prover.ServiceConfig{
		SetupDir: "$HOME/circuitOut/zakat",
		SrsDir:   "$HOME/kzgsrs",
		RpcURL:   "https://eth.llamarpc.com",
		ChainId:  1,
	})
	if err != nil {
		fmt.Println("Error initializing Zakat prover:", err)
		os.Exit(1)
	}
	
	fmt.Printf("Starting Zakat prover service on port %d...\n", *zakatPort)
	proverService.Serve("", *zakatPort)
}