// 1. Simulación de DataTypes
const DataTypes = {
    INTEGER: () => 'INTEGER_TYPE',
    STRING: () => 'STRING_TYPE',
    BOOLEAN: () => 'BOOLEAN_TYPE',
    TEXT: () => 'TEXT_TYPE',
    DATE: () => 'DATE_TYPE',
};

// 2. Simulación de UniqueConstraintError
class MockUniqueConstraintError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UniqueConstraintError';
    }
}

// 3. Exportaciones (ESM)
export const UniqueConstraintError = MockUniqueConstraintError;
export const Op = {
    iLike: Symbol.for('iLike'),
};
export { DataTypes };

// 4. Exportación por default
export default {
    UniqueConstraintError: MockUniqueConstraintError,
    Op: Op,
    DataTypes: DataTypes
};