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
declare class Index {
    private _map;
    private _indexes;
    constructor(options: IndexOptions);
    add(id: string, document: Record<string, any>): void;
    searchIndex(indexPath: string, operation: IndexQueryOperator, query: string): Set<string>;
    search(query: Record<string, IndexQueryCondition[]>[]): Set<string>;
    export(cb: (key: string, value: Map<string, Set<string>>) => void): void;
}

export { Index, IndexQueryCondition, IndexQueryOperator };
