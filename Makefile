
API_FILES_SRC=api/config.json api/package.json api/package-lock.json api/lib/
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

.PHONY: clean
clean:
	-rm api.tar.gz
	-rm web.tar.gz
