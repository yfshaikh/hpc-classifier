CC      = gcc
CFLAGS  = -O2 -Wall
BIN_DIR = bin

ADVERSARIAL = $(BIN_DIR)/cache_thrash $(BIN_DIR)/branch_abuse $(BIN_DIR)/row_hammer
BENIGN      = $(BIN_DIR)/matmul $(BIN_DIR)/memstream

all: $(ADVERSARIAL) $(BENIGN)

$(BIN_DIR)/cache_thrash: cache_thrash.c | $(BIN_DIR)
	$(CC) $(CFLAGS) -o $@ $<

$(BIN_DIR)/branch_abuse: branch_abuse.c | $(BIN_DIR)
	$(CC) $(CFLAGS) -o $@ $<

$(BIN_DIR)/row_hammer: row_hammer.c | $(BIN_DIR)
	$(CC) $(CFLAGS) -o $@ $<

$(BIN_DIR)/matmul: benign/matmul.c | $(BIN_DIR)
	$(CC) $(CFLAGS) -o $@ $<

$(BIN_DIR)/memstream: benign/memstream.c | $(BIN_DIR)
	$(CC) $(CFLAGS) -o $@ $<

$(BIN_DIR):
	mkdir -p $(BIN_DIR)

clean:
	rm -rf $(BIN_DIR)

.PHONY: all clean
