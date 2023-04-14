interface IndexOptions {
    document: {
        id: string;
        indexes: IndexOptionsIndexes;
    };
}
type IndexOptionsIndexes = Record<string, {
    tokenize: 'strict' | 'full' | 'none';
    type: 'string' | 'number';
}>;
type IndexQueryOperator = 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
type IndexQueryCondition = Partial<Record<IndexQueryOperator, any>>;
type IndexQuery = Record<string, IndexQueryCondition[]>[];
declare class Index {
    private _map;
    private _indexes;
    constructor(options: IndexOptions);
    add(id: string, document: Record<string, any>): void;
    searchIndex(indexPath: string, conditions: IndexQueryCondition[]): Set<string>;
    search(query: Record<string, IndexQueryCondition[]>[]): Set<string>;
    export(cb: (key: string, value: Map<string, Set<string>>) => void): void;
}
declare function query(query: IndexQuery, items: any[]): any[];

export { Index, IndexQuery, IndexQueryCondition, IndexQueryOperator, query };
