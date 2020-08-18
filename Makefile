# KIBANA_INSIGHT_PROD_SERVER should be set as environment variable
SERVER=$(KIBANA_INSIGHT_PROD_SERVER)
API_FILES_SRC=api/config.json api/package.json api/yarn.lock api/src/
API_FILES_SCAN=$(shell find $(API_FILES_SRC) -type f)
API_FILES_DEPS=api/node_modules
API_FILES_PKG=$(API_FILES_SRC) $(API_FILES_DEPS)

WEB_FILES=$(shell find web/yarn.lock web/package.json web/src web/public -type f)

.PHONY: package
package: package-api package-web

.PHONY: package-api
package-api: api.tar.gz

api.tar.gz: $(API_FILES_SCAN)
	tar czf $@ $(API_FILES_PKG)

.PHONY: package-web
package-web: web.tar.gz

web.tar.gz: $(WEB_FILES)
	-rm -rf web/build
	cd web && \
	npm run build && \
	cd build && \
	tar -c --transform 's,^\.,web,' -zf ../../web.tar.gz .

.PHONY: deploy-web
deploy-web: web.tar.gz
	scp web.tar.gz $(SERVER):/tmp
	ssh $(SERVER) sudo rm -rf /opt/kibana-insight/web
	ssh $(SERVER) sudo tar xf /tmp/web.tar.gz -C /opt/kibana-insight --owner root --group root

.PHONY: deploy-api
deploy-api: api.tar.gz
	scp api.tar.gz $(SERVER):/tmp
	ssh $(SERVER) sudo rm -rf /opt/kibana-insight/api
	ssh $(SERVER) sudo tar xf /tmp/api.tar.gz -C /opt/kibana-insight --owner root --group root
	ssh $(SERVER) sudo systemctl restart kibana-insight

.PHONY: deploy
deploy: deploy-web deploy-api

.PHONY: clean
clean:
	-rm api.tar.gz
	-rm web.tar.gz
