const log = require('log4js').getLogger("MappingCheck");

const FIELD_SEPARATOR = ".";

module.exports = class MappingCheck {
    constructor(mappingData) {
        this.mappingData = mappingData;
        this.fields = new Map();
    }

    check() {
        this.loadAllMappings();
        return this.checkFieldTypes();
    }

    loadAllMappings() {
        for(let idx of Object.keys(this.mappingData)) {
            let props = this.mappingData[idx].mappings.properties;
            this.loadIndexMappingProperties(idx, props);
        }
    }

    loadIndexMappingProperties(indexName, props, parents = []) {
        for(let fieldname of Object.keys(props)) {
            // build field path
            let fieldpath = parents.slice();
            fieldpath.push(fieldname);

            // get field object
            let f = props[fieldname];

            if(Object.prototype.hasOwnProperty.call(f, "properties")) {
                // if field is an object
                this.loadIndexMappingProperties(indexName, f.properties, fieldpath);
            } else {
                // if field isn't an object
                if(!Object.prototype.hasOwnProperty.call(f, "type")) {
                    throw new Error(`Field doesn't have type property: ${fieldpath.join(".")}`);
                }
                this.setFieldType(indexName, fieldpath, f.type);

                if(Object.prototype.hasOwnProperty.call(f, "fields")) {
                    this.loadIndexMappingProperties(indexName, f.fields, fieldpath);
                }
            }
        }
    }

    setFieldType(indexName, fieldPath, fieldType) {
        // build field path string
        let path = fieldPath.join(FIELD_SEPARATOR);

        // get type/index Map for field path
        let field = this.fields.get(path);

        // if we don't have a Map for that field path yet, create one
        if(field === undefined) {
            this.fields.set(path, field = new Map());
        }

        // get index set for field type
        let type = field.get(fieldType);

        // if we don't have an index set yet for that type, create one
        if(type === undefined) {
            field.set(fieldType, type = new Set());
        }

        // add index to type set
        type.add(indexName);
    }

    checkFieldTypes() {
        return new Map([...this.fields]
            .filter(([field, types]) => types.size > 1)
        );
    }
}
