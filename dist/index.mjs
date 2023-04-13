function get(obj, path, defaultValue = void 0) {
  const travel = (regexp) => String.prototype.split.call(path, regexp).filter(Boolean).reduce((res, key) => res !== null && res !== void 0 ? res[key] : res, obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === void 0 || result === obj ? defaultValue : result;
}
function union(args) {
  return new Set(args.reduce((acc, val) => [...acc, ...val], []));
}
function intersection(args) {
  const [first, ...rest] = args;
  return new Set([...first].filter((x) => rest.every((y) => y.has(x))));
}

const tokenizeMap = {
  strict: (value) => [value],
  words: (value) => value.split(" "),
  none: (value) => [value]
};
class Index {
  constructor(options) {
    this._indexes = options.document.indexes;
    this._map = new Map(Object.keys(options.document.indexes).map((indexPath) => {
      return [indexPath, /* @__PURE__ */ new Map()];
    }));
  }
  add(id, document) {
    Object.entries(this._indexes).forEach(([indexPath, index]) => {
      let tokens = [];
      const tokenize = tokenizeMap[index.tokenize];
      const value = get(document, indexPath);
      if (value === void 0)
        return;
      switch (index.type) {
        case "string":
          tokens = tokenize(value);
          break;
        case "number":
          tokens = [value];
      }
      const map = this._map.get(indexPath);
      if (map) {
        tokens.forEach((token) => {
          if (!map.has(token))
            map.set(token, /* @__PURE__ */ new Set());
          map.get(token).add(id);
        });
      }
    });
  }
  searchIndex(indexPath, operation, query) {
    const index = this._indexes[indexPath];
    const map = this._map.get(indexPath);
    if (!index || !map)
      return /* @__PURE__ */ new Set();
    let tokens = [];
    const ids = /* @__PURE__ */ new Set();
    switch (index.type) {
      case "string":
        tokens = tokenizeMap[this._indexes[indexPath].tokenize](query);
        break;
      case "number":
        tokens = [query];
    }
    for (const token of tokens) {
      if (operation === "eq") {
        if (map.has(token))
          return map.get(token);
        else
          return /* @__PURE__ */ new Set();
      }
      for (const [key, value] of map.entries()) {
        switch (operation) {
          case "lt":
            if (key < token) {
              for (const id of value)
                ids.add(id);
            }
            break;
          case "lte":
            if (key <= token) {
              for (const id of value)
                ids.add(id);
            }
            break;
          case "gt":
            if (key > token) {
              for (const id of value)
                ids.add(id);
            }
            break;
          case "gte":
            if (key >= token) {
              for (const id of value)
                ids.add(id);
            }
            break;
        }
      }
    }
    return ids;
  }
  search(query) {
    return union(query.map(
      (conditions) => intersection(Object.keys(conditions).map(
        (indexPath) => union(conditions[indexPath].map(
          (condition) => intersection(Object.keys(condition).map(
            (operation) => this.searchIndex(indexPath, operation, condition[operation])
          ))
        ))
      ))
    ));
  }
  export(cb) {
    this._map.forEach((value, key) => {
      cb(key, value);
    });
  }
}

export { Index };
