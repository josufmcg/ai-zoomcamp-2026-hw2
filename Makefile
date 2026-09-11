FRONTEND_DIR := frontend
NODE_VERSION ?= 20

.PHONY: frontend-install frontend frontend-build frontend-test

define run_frontend
	@if [ -s "$$HOME/.nvm/nvm.sh" ]; then . "$$HOME/.nvm/nvm.sh" && nvm use $(NODE_VERSION) >/dev/null; fi; \
	node -e 'if (Number(process.versions.node.split(".")[0]) < $(NODE_VERSION)) { console.error("Expenses4All requires Node.js $(NODE_VERSION)+. Run: source ~/.nvm/nvm.sh && nvm install $(NODE_VERSION) && nvm use $(NODE_VERSION)"); process.exit(1); }'; \
	$(1)
endef

frontend-install:
	$(call run_frontend,cd $(FRONTEND_DIR) && npm install)

frontend:
	$(call run_frontend,cd $(FRONTEND_DIR) && npm run dev)

frontend-build:
	$(call run_frontend,cd $(FRONTEND_DIR) && npm run build)

frontend-test:
	$(call run_frontend,cd $(FRONTEND_DIR) && npm test)
