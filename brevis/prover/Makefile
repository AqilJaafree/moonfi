install:
	go build -o $(HOME)/go/bin/zakat_prover ./cmd/zakat_prover.go
	go build -o $(HOME)/go/bin/premium_prover ./cmd/premium_prover.go

config:
	# create log files
	sudo mkdir -p /var/log/muslimgo
	sudo touch /var/log/muslimgo/zakat.log
	sudo touch /var/log/muslimgo/premium.log
	# copying over systemd config files
	sudo cp configs/*.service /etc/systemd/system
	sudo systemctl daemon-reload
	sudo systemctl enable muslimgo-zakat
	sudo systemctl enable muslimgo-premium

deploy: config install
	sudo systemctl restart muslimgo-zakat
	sudo systemctl restart muslimgo-premium

start:
	go run ./cmd/zakat_prover.go &
	go run ./cmd/premium_prover.go &

start-zakat:
	go run ./cmd/zakat_prover.go

start-premium:
	go run ./cmd/premium_prover.go