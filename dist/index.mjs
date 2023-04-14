import * as R from 'rambda';

function get(obj, path, defaultValue = void 0) {
  return path.split(".").reduce((acc, val) => {
    if (acc === void 0)
      return defaultValue;
    return acc[val];
  }, obj);
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
  searchIndex(indexPath, conditions) {
    const index = this._indexes[indexPath];
    const map = this._map.get(indexPath);
    if (!index || !map)
      return /* @__PURE__ */ new Set();
    let ids;
    for (const condition of conditions) {
      let tokens = [];
      for (const [operation, query2] of Object.entries(condition)) {
        const tmp = /* @__PURE__ */ new Set();
        switch (index.type) {
          case "string":
            tokens = tokenizeMap[this._indexes[indexPath].tokenize](query2);
            break;
          case "number":
            tokens = [query2];
        }
        for (const token of tokens) {
          if (operation === "eq") {
            if (map.has(token))
              map.get(token).forEach((id) => tmp.add(id));
          } else {
            map.forEach((ids2, key) => {
              if (operation === "lt" && key < token)
                ids2.forEach((id) => tmp.add(id));
              else if (operation === "lte" && key <= token)
                ids2.forEach((id) => tmp.add(id));
              else if (operation === "gt" && key > token)
                ids2.forEach((id) => tmp.add(id));
              else if (operation === "gte" && key >= token)
                ids2.forEach((id) => tmp.add(id));
            });
          }
        }
        if (!ids)
          ids = tmp;
        else
          ids = intersection([ids, tmp]);
      }
    }
    return ids;
  }
  search(query2) {
    return union(query2.map(
      (conditions) => intersection(Object.keys(conditions).map(
        (indexPath) => this.searchIndex(indexPath, conditions[indexPath])
      ))
    ));
  }
  export(cb) {
    this._map.forEach((value, key) => {
      cb(key, value);
    });
  }
}
function query(query2, items) {
  const f = R.anyPass(
    R.map((q) => {
      return R.allPass(R.map(checkRule, Object.entries(q)));
    }, query2)
  );
  return R.filter(
    f,
    items
  );
}
function checkCondition(condition) {
  return (value) => {
    if (!value)
      return false;
    for (const operator of R.keys(condition)) {
      switch (operator) {
        case "eq":
          return value === condition[operator];
        case "gte":
          return value >= condition[operator];
        case "gt":
          return value > condition[operator];
        case "lte":
          return value <= condition[operator];
        case "lt":
          return value < condition[operator];
      }
    }
    return false;
  };
}
function checkRule([indexPath, conditions]) {
  if (!conditions.length)
    return R.always(true);
  return (item) => R.anyPass(R.map(checkCondition, conditions))(
    R.path(indexPath.split("."), item)
  );
}

export { Index, query };
