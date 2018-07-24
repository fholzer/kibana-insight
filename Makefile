
API_FILES_STATIC=api/config.json api/package.json api/package-lock.json
API_FILES_DIRS=api/lib/ api/node_modules/
API_FILES=$(API_FILES_STATIC) $(shell find $(API_FILES_DIRS) -type f)

WEB_FILES=$(shell find web/yarn.lock web/package.json web/src web/public -type f)

.PHONY: package
package: package-api package-web

.PHONY: package-api
package-api: api.tar.gz

api.tar.gz: $(API_FILES)
	tar czf $@ $(API_FILES_STATIC) $(API_FILES_DIRS)

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
